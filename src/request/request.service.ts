import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import 'dotenv/config';

@Injectable()
export class RequestService {
  constructor(private readonly httpService: HttpService) {}

  private readonly logger = new Logger(RequestService.name);

  //@Cron('0 30 11 * * *')
  @Cron('02 * * * * *')
  async scheduledRequest(): Promise<any> {
    this.logger.debug('Called when the current time is 23:30');
    const parser = new Parser();
    const usUrl = process.env.US_URL;
    const dataUS = await this.getInfo(usUrl);
    const csvUs = parser.parse(dataUS);
    const chinaUrl = process.env.CHINA_URL;
    const dataChina = await this.getInfo(chinaUrl);
    const csvChina = parser.parse(dataChina);
    try {
      const basePath = process.cwd();
      const fileDir = path.join(basePath, 'files');
      const fileExists = fs.existsSync(fileDir);
      if (!fileExists) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFile(`${fileDir}/china.csv`, csvChina, async () => {
        this.logger.debug('china.csv created!');
        await this.upload(`${fileDir}/china.csv`);
      });
      fs.writeFile(`${fileDir}/us.csv`, csvUs, async () => {
        this.logger.debug('us.csv created!');
        await this.upload(`${fileDir}/us.csv`);
      });
    } catch (e) {
      throw e;
    }
  }

  async getInfo(url: string): Promise<any> {
    try {
      const response = await this.httpService
        .get(url)
        .pipe(map((response) => response.data));
      // if (status === 200) {
      return firstValueFrom(response);
      // }
    } catch (e) {
      throw new InternalServerErrorException(`${e}`);
    }
  }

  async upload(filename: string): Promise<any> {
    const server = await this.httpService
      .get('https://api.gofile.io/getServer')
      .pipe(map((response) => response.data.server));
    const formData = new FormData();
    await formData.append('file,', fs.createReadStream(filename), filename);
    formData.append('token', process.env.GOFILE_TOKEN);
    formData.append('folderId', process.env.GOFILE_FOLDERID);
    const response = await formData.submit(
      `https://${server}.gofile.io/uploadFile`,
    );
    // const response = await this.httpService.post(
    //  `https://${server}.gofile.io/uploadFile`,
    //  formData,
    // );
    return response;
  }
}
