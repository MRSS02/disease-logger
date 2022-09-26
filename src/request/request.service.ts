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

  @Cron('0 30 23 * * *')
  //@Cron('02 * * * * *')
  async scheduledRequest(): Promise<any> {
    this.logger.debug('Called when the current time is 11:30 PM');
    // this.logger.debug('Called when the current second is 2');
    const parser = new Parser();
    const usUrl = process.env.US_URL;
    const dataUS = await this.getInfo(usUrl);
    const csvUs = parser.parse(dataUS);
    const chinaUrl = process.env.CHINA_URL;
    const dataChina = await this.getInfo(chinaUrl);
    const csvChina = parser.parse(dataChina);
    try {
      const findServer = await this.findServer();
      const server = findServer.data.server;
      const basePath = process.cwd();
      const fileDir = path.join(basePath, 'files');
      const fileExists = fs.existsSync(fileDir);
      if (!fileExists) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFile(`${fileDir}/china.csv`, csvChina, async () => {
        this.logger.debug('china.csv created!');
        console.log(await this.upload(`${fileDir}/china.csv`, server));
      });
      fs.writeFile(`${fileDir}/us.csv`, csvUs, async () => {
        this.logger.debug('us.csv created!');
        console.log(await this.upload(`${fileDir}/us.csv`, server));
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
      throw new InternalServerErrorException(e);
    }
  }

  async findServer(): Promise<any> {
    try {
      const server = await this.httpService
        .get('https://api.gofile.io/getServer')
        .pipe(map((response) => response.data));
      return firstValueFrom(server);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async upload(filename: string, server: string): Promise<any> {
    try {
      const formData: FormData = new FormData();
      const file: Buffer = await fs.promises.readFile(filename);
      formData.append('file', file, filename);
      formData.append('token', process.env.GOFILE_TOKEN);
      formData.append('folderId', process.env.GOFILE_FOLDER_ID);
      const response = await this.httpService
        .post(`https://${server}.gofile.io/uploadFile`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .pipe(map((response) => response.data));
      await fs.promises.unlink(filename);
      return firstValueFrom(response);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
