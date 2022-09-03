import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Parser } from 'json2csv';
import fs from 'fs';

@Injectable()
export class RequestService {

  constructor(private readonly httpService: HttpService,
              private readonly requestService: RequestService) {}

 private readonly logger = new Logger(RequestService.name);
  
 //@Cron('0 30 11 * * *')
 @Cron('2 * * * * *')
 scheduledRequest(): void {
    
    this.logger.debug('Called when the current second is 2');
    const parser = new Parser();
    const usUrl = 'https://disease.sh/v3/covid-19/countries/usa';
    const dataUS = await this.requestService.getInfo(usUrl);
    const csvUs = parser.parse(dataUS);
    const chinaUrl = 'https://disease.sh/v3/covid-19/countries/china';
    const dataChina = await this.requestService.getInfo(chinaUrl);
    const csvChina = parser.parse(dataChina); 
    try {
    fs.writeFile('../../files/china.csv', csvChina, () => { 
      this.logger.debug('china.csv created!');
      this.upload('./china.csv'); 
    })
    fs.writeFile('../../files/us.csv', csvUs, () => { 
      this.logger.debug('us.csv created!');
      this.upload('./us.csv'); 
    })
    } catch (e) {
      throw e;
    }
  }

  async getInfo(url: string): Promise<any> {

    try {
      const response = this.httpService.get(url).pipe(map(response => response.data));
      // if (status === 200) {
        return await firstValueFrom(response);
      // }

    } catch(e) {
      throw new InternalServerErrorException(`${e}`);
    }
  }

  upload(filename: string) {

  }
}
