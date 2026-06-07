import { Controller, Post, UseInterceptors, UploadedFiles, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('diagnose')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async diagnoseLeaf(@UploadedFiles() files: any[]) {
    if (!files || files.length === 0) {
      throw new HttpException('No image files provided', HttpStatus.BAD_REQUEST);
    }
    
    // Forward the files to the Python ML Inference Service
    try {
      const result = await this.appService.getPredictionFromMLService(files);
      return result;
    } catch (error) {
      throw new HttpException(
        'Failed to communicate with ML Inference Service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
