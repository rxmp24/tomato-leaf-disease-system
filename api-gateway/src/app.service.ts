import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://tomato-leaf-disease-system.onrender.com/predict';

  async getPredictionFromMLService(file: any): Promise<any> {
    this.logger.log(`Forwarding image to ML Service at ${this.ML_SERVICE_URL}`);
    
    // Create form data using native Node.js APIs
    const formData = new FormData();
    // Convert the buffer to a Blob for native fetch
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    try {
      const response = await fetch(this.ML_SERVICE_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ML Service returned status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Error communicating with ML Service: ${error.message}`);
      throw error;
    }
  }
}
