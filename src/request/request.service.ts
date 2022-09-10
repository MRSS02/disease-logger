import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Parser } from 'json2csv';
import fs from 'fs';
import 'dotenv/config';

@Injectable()
export class RequestService {

  constructor(private readonly httpService: HttpService,
              private readonly requestService: RequestService) {}

 private readonly logger = new Logger(RequestService.name);
  
 //@Cron('0 30 11 * * *')
 @Cron('02 * * * * *')
 async scheduledRequest(): Promise<any> {
    this.logger.debug('Called when the current second is 2');
    const parser = new Parser();
    const usUrl = process.env.US_URL;
    const dataUS = await this.requestService.getInfo(usUrl);
    const csvUs = parser.parse(dataUS);
    const chinaUrl = process.env.CHINA_URL;
    const dataChina = await this.requestService.getInfo(chinaUrl);
    const csvChina = parser.parse(dataChina);
    try {
    fs.writeFile('../../files/china.csv', csvChina, async () => { 
      this.logger.debug('china.csv created!');
      await this.upload('../../files/china.csv'); 
    })
    fs.writeFile('../../files/us.csv', csvUs, async () => { 
      this.logger.debug('us.csv created!');
      await this.upload('../../files/us.csv'); 
    })
    } catch (e) {
      throw e;
    }
  }

  async getInfo(url: string): Promise<any> {

    try {
      const response = await this.httpService.get(url).pipe(map(response => response.data));
      // if (status === 200) {
        return firstValueFrom(response);
      // }

    } catch(e) {
      throw new InternalServerErrorException(`${e}`);
    }
  }

  async upload(filename: string): Promise<any> {
    const server = await this.httpService.get("https://api.gofile.io/getServer")
    .pipe(map(response => response.data.server));
    const file = fs.readFileSync(filename, { encoding: 'utf8' })
    const response = await this.httpService.post(`https://${server}.gofile.io/uploadFile`, 
                                           { file: file, token: process.env.GOFILE_TOKEN });
    return firstValueFrom(response);

  }
}
