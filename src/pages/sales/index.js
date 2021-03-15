import RangePicker from '../../components/range-picker/index.js';
import SortableTable from '../../components/sortable-table/index.js';
import header from './sales-header.js';

import fetchJson from '../../utils/fetch-json.js';

export default class Page {
  element;
  subElements = {};
  components = {};


  async initComponents () {
    const to = new Date();
    const from = new Date(to.getTime() - (30 * 24 * 60 * 60 * 1000));

    const rangePicker = new RangePicker({
      from,
      to
    });

    const sortableTable = new SortableTable(header, {
      url: `/api/rest/orders?createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}`,
      sorted: {id: 'createdAt', order: 'desc'}
    });

    this.components.sortableTable = sortableTable;
    this.components.rangePicker = rangePicker;
  }

  async updateTableComponent (from, to) {
    const sorted = this.components.sortableTable.sorted;
    const newUrl = `${process.env.BACKEND_URL}api/rest/orders?createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}&_sort=${sorted.id}&_order=${sorted.order}&_start=1&_end=21`;
    const data = await fetchJson(newUrl);

    this.components.sortableTable.url = new URL(newUrl);
    this.components.sortableTable.start = 1;
    this.components.sortableTable.end = this.components.sortableTable.start + this.components.sortableTable.step;
    this.components.sortableTable.addRows(data);
  }

  get template () {
    return `<div class="sales">
    <div class="content__top-panel">
      <h2 class="page-title">Продажи</h2>
      <!-- RangePicker component -->
      <div data-element="rangePicker"></div>
    </div>
    <div data-element="sortableTable"></div>
  </div>`;
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.initComponents();

    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  renderComponents () {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners () {
    this.components.rangePicker.element.addEventListener('date-select', event => {
      const { from, to } = event.detail;
      this.updateTableComponent(from, to);
    });
  }

  destroy () {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}