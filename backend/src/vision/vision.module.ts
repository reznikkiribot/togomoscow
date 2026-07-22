import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';
import { UploadsModule } from '../uploads/uploads.module';
import { OllamaService } from './ollama.service';
import { EmbeddingService } from './embedding.service';
import { VectorSearchService } from './vector-search.service';
import { ClipService } from './clip.service';
import { OCRService } from './ocr.service';
import { VisionRecognitionService } from './vision-recognition.service';
import { VisionController } from './vision.controller';

// Multimodal recognition (photo → dish/drink/wine/menu). Self-contained module; the
// rest of the app is untouched. Extensible: swap OllamaService for a CLIP/SigLIP
// server, or VectorSearchService for pgvector, behind the same interfaces.
@Module({
  imports: [PrismaModule, UsersModule, ListingsModule, UploadsModule],
  controllers: [VisionController],
  providers: [OllamaService, EmbeddingService, VectorSearchService, ClipService, OCRService, VisionRecognitionService],
  exports: [EmbeddingService, VectorSearchService, ClipService, OllamaService],
})
export class VisionModule {}
