import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { WebsocketService } from './websocket.service';



@Injectable()
export class HotelService {
  public wsData: Subject<any>;
  public url = "wss://demoapi.night2stay.com/api/v2/websocket";

  constructor(wsService: WebsocketService) {
    this.wsData = <Subject<any>>wsService
      .connect(this.url)
      .map((response: MessageEvent): any => {
        let data = JSON.parse(response.data);
        // return {
        //   key: data.key,
        //   status: data.status,
        //   data: data.data,
        //   timezone: data.timezone
        // }
        return data;
      });
  }
}
