import { Component } from '@angular/core';
import { HotelService } from './hotel.service';
import { WebsocketService } from './websocket.service';

class hotelCard {
  private name: string;
  private image: any;
  private starAmount: number;
  private address: string;
  private price_d_false: string;
  private price_d_true: string;
  private discount: number;
  constructor(name: string, image: any, starAmount: number, address: string, price_d_false: string, price_d_true: string, discount: number) {
    this.name = name;
    this.image = image;
    this.starAmount = starAmount;
    this.address = address;
    this.price_d_false = price_d_false;
    this.price_d_true = price_d_true;
    this.discount = discount;
  }
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [WebsocketService, HotelService]
})

export class AppComponent {
  constructor(private hotelService: HotelService) {
    hotelService.wsData.subscribe(msg => {
      //Авторизация
      if (msg.key == this.authKey) {
        if (msg.status == 200) {
          // console.log("authorised");
          this.isAuthorised = true;
          this.getHotels();
        }
      }

      //Получение отелей
      if (msg.key == this.getListKey) {

        let k = this.ShowingStep;
        //Проверка случай, если данных придет меньше, чем рассчитывается исходя из шага в каждом запросе (this.ShowingStep)
        if (msg.data.search.length - this.CardsContainer.length < this.ShowingStep) {
          k = msg.data.search.length - this.CardsContainer.length;
        }
        //Проверка на последнюю пачку данных, чтобы больше не отправлять запросы (есть возможность отправлять и не показывать результаты, но я решил, что так будет правильнее)
        if (k < this.ShowingStep || this.CardsContainer.length + this.ShowingStep == msg.data.total) {
          this.StopRequesting = true;
        }
        //skipper - переменная,которая пропускает все то, что уже есть на странице и добавляет только новые
        //skipper сделан потому, что я не понял как мне сказать в запросе дай мне с такого-то по такой-то элемент(lastid падает с 500 ошибкой, я пробовал)
        let skipper = msg.data.search.length - k;
        for (let item of msg.data.search) {
          if (skipper > 0) {
            skipper--;
            continue;
          }
          let name = item.info.name;
          let image = {};

          if (item.info.img != null && item.info.img != undefined && item.info.img != "") {
            image = {
              'background-image': ' url("https://img1.night2stay.com' + item.info.img + ' ")'
            }
          } else {
            image = {
              'background-image': ' url("https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/No_image_available_600_x_450.svg/600px-No_image_available_600_x_450.svg.png")'
            }
          }

          let starAmount = item.info.cat;
          let address = item.info.addr;
          let price_d_false = item.items[0][0].commerce.payment;
          let price_d_true = item.items[0][0].commerce.tpayment;
          let discount = item.items[0][0].commerce.discount;
          let tempCard = new hotelCard(name, image, starAmount, address, price_d_false, price_d_true, discount)
          this.CardsContainer.push(tempCard);
        }
      }

      // console.log(this.CardsContainer);
      this.scrollMute = false;


    });
  }
  //Контейнер в котором происходит рендер всех карточек
  public CardsContainer = Array<hotelCard>();
  //Ключ для авторизации
  private authKey = "4bd97223-9ad0-4261-821d-3e9ffc356e32";
  //Ключ для получения списка
  private getListKey = "2ee1edbf-4261-d90f-4785-b9db-5b07ce70a928";
  //Переменная для того, чтобы не срабатывали события на скролл в момент, пока не пришел ответ с сервера на предыдущий скролл
  private scrollMute: boolean = false;
  //Количестпо отображаемых карточек за 1 раз
  private ShowingStep = 8;
  //Вспомогательная переменная
  private lastNum: number = this.ShowingStep;
  //Флаг остановки запросов
  private StopRequesting = false;
  //Флаг показывает статус авторизации
  private isAuthorised = false;

  //Прячет иконку загрузки
  hideloader() {
    document.getElementById("loader").style.display = "none";
  }
  //обработчик собитай на скролл контейнера с отелями, чтобы постепенно подгружались остальные
  scrollHandler(e) {
    if (this.StopRequesting) {
      this.hideloader();
      return;
    }
    const frame = document.getElementById("CardContainer");
    if (frame.scrollTop + window.innerHeight + 10 >= frame.scrollHeight && !this.scrollMute) {
      this.scrollMute = true;
      this.getHotels()
    }
  }
  authorise() {
    console.log(this.hotelService);
    let request = {
      "action": "login",
      "data": {
        "key": "123123 ",
        "wlcompany": "CMPN00000053"
      },
      "key": this.authKey,
      "type": "account"
    }
    this.hotelService.wsData.next(request);
  }
  getHotels() {
    let request = {
      "action": "accommodation",
      "data": {
        "place": {
          "in": "CI266088ZZ"
        },
        "date": {
          "in": 1549756800000,
          "out": 1549929600000
        },
        "families": [
          {
            "adults": 2
          }
        ],
        "lastid": 0,
        "num": this.lastNum
      },
      "key": this.getListKey,
      "type": "service"
    }
    this.lastNum += this.ShowingStep;
    this.hotelService.wsData.next(request);
  }
  ngOnInit() {
    //Попытка авторизации каждый 100мс до победного
    let a = setInterval(() => {
      if (!this.isAuthorised) {
        this.authorise()
      } else {
        clearInterval(a)
      }
    }, 100)
  }
}

