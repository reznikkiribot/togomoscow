import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TRUST_CONFIG, TrustConfigShape } from './trust.types';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch as T;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    const prior = result[key];
    result[key] =
      value && typeof value === 'object' && !Array.isArray(value) && prior && typeof prior === 'object'
        ? deepMerge(prior, value)
        : value;
  }
  return result as T;
}

@Injectable()
export class TrustConfigService {
  private readonly log = new Logger(TrustConfigService.name);
  private cache: { value: TrustConfigShape; version: string; expires: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<{ config: TrustConfigShape; formulaVersion: string }> {
    if (this.cache && this.cache.expires > Date.now()) {
      return { config: this.cache.value, formulaVersion: this.cache.version };
    }
    const row = await this.prisma.trustConfig.findUnique({ where: { id: 'active' } });
    const config = deepMerge(DEFAULT_TRUST_CONFIG, row?.config ?? {});
    const formulaVersion = row?.formulaVersion || 'trust-v1';
    this.validate(config);
    this.cache = { value: config, version: formulaVersion, expires: Date.now() + 30_000 };
    return { config, formulaVersion };
  }

  async update(adminId: string, configPatch: unknown, formulaVersion?: string) {
    const current = await this.get();
    const next = deepMerge(current.config, configPatch);
    this.validate(next);
    const version = (formulaVersion || current.formulaVersion).trim().slice(0, 80);
    if (!version) throw new BadRequestException('formulaVersion is required');
    const configJson = next as unknown as Prisma.InputJsonValue;
    await this.prisma.$transaction(async (tx) => {
      await tx.trustConfig.upsert({
        where: { id: 'active' },
        create: { id: 'active', formulaVersion: version, config: configJson },
        update: { formulaVersion: version, config: configJson },
      });
      await tx.trustConfigAudit.create({
        data: {
          adminId,
          previousConfig: current.config as unknown as Prisma.InputJsonValue,
          nextConfig: configJson,
          formulaVersion: version,
        },
      });
    });
    this.cache = null;
    this.log.log(JSON.stringify({ event: 'configuration_changed', adminId, formulaVersion: version }));
    return { config: next, formulaVersion: version };
  }

  private validate(config: TrustConfigShape) {
    const numeric = [
      config.baseScore,
      ...Object.values(config.scores),
      ...Object.values(config.location),
      ...Object.values(config.status),
      ...Object.values(config.velocity),
      ...Object.values(config.travel),
      ...Object.values(config.photos),
      ...Object.values(config.text),
      ...Object.values(config.patterns),
      ...Object.values(config.userTrust),
    ];
    if (numeric.some((value) => !isNumber(value))) throw new BadRequestException('Trust config contains a non-numeric value');
    if (config.location.confirmedRadiusMeters < 0 || config.location.probableRadiusMeters < config.location.confirmedRadiusMeters) {
      throw new BadRequestException('Location radii are invalid');
    }
    if (config.location.rawLocationRetentionHours <= 0 || config.location.maximumLocationAgeSeconds <= 0) {
      throw new BadRequestException('Location retention and age must be positive');
    }
    if (!Array.isArray(config.ratingWeights) || config.ratingWeights.length === 0) {
      throw new BadRequestException('ratingWeights must not be empty');
    }
    const sorted = [...config.ratingWeights].sort((a, b) => a.min - b.min);
    if (
      sorted[0].min !== 0 ||
      sorted[sorted.length - 1].max !== 100 ||
      sorted.some((band, index) => !isNumber(band.weight) || band.weight < 0 || band.weight > 1 || band.min > band.max || (index > 0 && band.min !== sorted[index - 1].max + 1))
    ) {
      throw new BadRequestException('ratingWeights must cover 0..100 without gaps and use weights 0..1');
    }
  }
}
