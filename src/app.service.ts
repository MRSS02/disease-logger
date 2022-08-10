import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  async getInfo(): Promise<object> {
    const response = await axios.post(`https://disease.sh/v3/covid-19/countries/usa`);
    return response.data;
  }
}
