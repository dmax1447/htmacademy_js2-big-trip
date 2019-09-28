/* eslint-disable no-unused-vars */

import Sort from './sort.js';
import TripController from './trip-controller';
import TripInfo from './trip-info.js';
import Statistics from './statistics.js';
import Filter from './filter.js';
import {Position, MILISECONDS_PER_HOUR} from './constants.js';
import {render, unrender, createElement} from './utils.js';
import Chart from 'chart.js';
// import ChartDataLabels from 'chartjs-plugin-datalabels';
import API from './api.js';
const END_POINT = `https://htmlacademy-es-9.appspot.com/big-trip/`;
const AUTHORIZATION = `Basic kjhfdKJLfdsf${Math.random()}`;

class MainController {
  constructor(events, destinations, offers) {
    this.api = new API({endPoint: END_POINT, authorization: AUTHORIZATION});
    this._events = events;
    this._sort = new Sort();
    this._filter = new Filter();
    this._tripInfo = new TripInfo(events);
    this._statistics = new Statistics(events);
    this._onDataChangeInTripController = this._onDataChangeInTripController.bind(this);
    this._tripController = new TripController(this._renderTripDaysContainer(), events, destinations, offers, this._onDataChangeInTripController);
  }

  // начальная инициализация
  init() {
    this._renderStat();
    this._statistics.hide();
    this._renderTripInfo();
    this._renderFilter();
    this._tripController.init();
  }

  loadEvents() {
    return this.api.getEvents()
      .then((events) => {
        this._events = events;
      });
  }

  // подготовка контейнера для событий
  _renderTripDaysContainer() {
    const tripEventsContainer = document.querySelector(`.trip-events`);
    const tripDaysContainer = createElement(`<ul class="trip-days"></ul>`);
    render(tripEventsContainer, tripDaysContainer, Position.BEFOREEND);
    return tripDaysContainer;
  }

  // рендер фильтров FUTURE / PAST / EVERYTHING и инициализация обработчиков нажатия на кнопки
  _renderFilter() {
    const filterContainer = document.querySelector(`.trip-main__trip-controls`);
    const element = this._filter.getElement();
    render(filterContainer, element, Position.BEFOREEND);
    const filterInputs = [...element.querySelectorAll(`.trip-filters__filter-input`)];

    const onFilterTabClick = (evt) => {
      const activeFilter = evt.target.value;
      const today = (new Date()).valueOf();
      let eventsFiltered = [];
      switch (activeFilter) {
        case `future`:
          eventsFiltered = this._events.filter((event) => event.startDate > today);
          break;
        case `past`:
          eventsFiltered = this._events.filter((event) => event.startDate < today);
          break;
        default:
          break;
      }
      this._tripController.renderDays(activeFilter === `everything` ? this._events : eventsFiltered, true);
    };

    filterInputs.forEach((input) => input.addEventListener(`click`, onFilterTabClick));
  }

  // рендер статистики
  _renderStat() {
    if (this._statistics._element) {
      unrender(this._statistics);
    }
    const element = this._statistics.getElement();
    const mainPageContainer = document.querySelector(`main .page-body__container`);
    render(mainPageContainer, element, Position.BEFOREEND);
    const moneyCtx = element.querySelector(`.statistics__chart--money`);
    const transportCtx = element.querySelector(`.statistics__chart--transport`);
    const timeSpendCtx = document.querySelector(`.statistics__chart--time`);

    const moneyStat = {
      fly: 0,
      stay: 0,
      drive: 0,
      look: 0,
      eat: 0,
      ride: 0
    };

    const transportStat = {
      drive: 0,
      ride: 0,
      fly: 0,
      sail: 0,
    };

    const timeStat = {
    };

    this._events.forEach((event) => {
      timeStat[event.type] = timeStat[event.type] === undefined ?
        Math.round((event.endDate - event.startDate) / MILISECONDS_PER_HOUR) : timeStat[event.type] + Math.round((event.endDate - event.startDate) / MILISECONDS_PER_HOUR);
      if (event.type === `flight`) {
        moneyStat.fly += event.cost;
        transportStat.fly += 1;
      }
      if (event.type === `check-in`) {
        moneyStat.stay += event.cost;
      }
      if (event.type === `drive`) {
        moneyStat.drive += event.cost;
        transportStat.drive += 1;
      }
      if (event.type === `sightseeing`) {
        moneyStat.look += event.cost;
      }
      if (event.type === `restaurant`) {
        moneyStat.eat += event.cost;
      }
      if (event.type === `bus` || event.type === `taxi`) {
        moneyStat.ride += event.cost;
        transportStat.ride += 1;
      }
      if (event.type === `ship`) {
        transportStat.sail += 1;
      }
    });

    const moneyChart = new Chart(moneyCtx, {
      type: `horizontalBar`,
      data: {
        labels: [...Object.keys(moneyStat)],
        datasets: [{
          label: `MONEY`,
          data: [...Object.values(moneyStat)],
          backgroundColor: `white`,
          borderWidth: 0,
        }]
      },
      options: {
        scales: {
          xAxes: [{
            barThickness: 5,
            gridLines: {
              display: false
            },
            ticks: {
              enabled: false,
            }
          }],
          yAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              enabled: true,
              fontSize: 18,
            }
          }]
        },
      },
    });

    const transportChart = new Chart(transportCtx, {
      type: `horizontalBar`,
      data: {
        labels: [...Object.keys(transportStat)],
        datasets: [{
          label: `TRANSPORT`,
          data: [...Object.values(transportStat)],
          backgroundColor: `white`,
          borderWidth: 0,
        }]
      },
      options: {
        scales: {
          xAxes: [{
            barThickness: 5,
            gridLines: {
              display: false
            },
          }],
          yAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              enabled: true,
              fontSize: 18,
            }
          }]
        }
      },
    });

    const timeChart = new Chart(timeSpendCtx, {
      type: `horizontalBar`,
      data: {
        labels: [...Object.keys(timeStat)],
        datasets: [{
          label: `TIME`,
          data: [...Object.values(timeStat)],
          backgroundColor: `white`,
          borderWidth: 0,
        }]
      },
      options: {
        scales: {
          xAxes: [{
            barThickness: 5,
            gridLines: {
              display: false
            },
          }],
          yAxes: [{
            gridLines: {
              display: false
            },
            ticks: {
              enabled: true,
              fontSize: 18,
            }
          }]
        }
      },
    });

    const onMenuTabClick = (evt) => {
      const tabName = evt.target.innerText;
      switch (tabName) {
        case `Table`:
          this._tripController.show();
          this._statistics.hide();
          menuBtnTable.classList.add(`trip-tabs__btn--active`);
          menuBtnStats.classList.remove(`trip-tabs__btn--active`);
          break;
        case `Stats`:
          this._tripController.hide();
          this._statistics.show();
          menuBtnStats.classList.add(`trip-tabs__btn--active`);
          menuBtnTable.classList.remove(`trip-tabs__btn--active`);
          break;
        default:
          break;
      }
    };

    const menuBtnTable = document.querySelector(`.trip-tabs__btn--Table`);
    const menuBtnStats = document.querySelector(`.trip-tabs__btn--Stats`);
    const menuBtns = [menuBtnTable, menuBtnStats];
    menuBtns.forEach((btn) => btn.addEventListener(`click`, onMenuTabClick));
  }

  // рендер информации о поездке
  _renderTripInfo() {
    if (this._tripInfo._element) {
      unrender(this._tripInfo);
    }
    this._tripInfo = new TripInfo(this._events);
    const tripInfoContainer = document.querySelector(`.trip-main__trip-info`);
    render(tripInfoContainer, this._tripInfo.getElement(), Position.AFTERBEGIN);
    document.querySelector(`.trip-info__cost-value`).textContent = this._tripInfo._totalCost;
  }

  // обработка изменений данных
  _onDataChangeInTripController(commit) {
    switch (commit.type) {
      case `create`:

        break;
      case `update`:
        this.api.updateEvent(commit.data)
          .then(() => {
            this.update();
          });
        break;
      case `delete`:
        this.api.deleteEvent(commit.data)
          .then(() => {
            this.update();
          });
        break;

      default:
        break;
    }
    this._renderTripInfo();
    this._renderStat();
  }

  update() {
    this.api.getEvents()
      .then((events) => {
        this._tripController._events = events;
        this._tripController.renderDays(true);
      });
  }
}

export default MainController;
