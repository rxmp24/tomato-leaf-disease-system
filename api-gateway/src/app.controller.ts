import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('diagnose')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async diagnoseLeaf(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No image file provided', HttpStatus.BAD_REQUEST);
    }
    
    // Forward the file to the Python ML Inference Service
    try {
      const result = await this.appService.getPredictionFromMLService(file);
      return result;
    } catch (error) {
      throw new HttpException(
        'Failed to communicate with ML Inference Service',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
