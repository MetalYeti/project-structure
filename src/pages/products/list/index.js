import SortableTable from '../../../components/sortable-table/index.js';
import DoubleSlider from '../../../components/double-slider/index.js';
import header from './bestsellers-header.js';

//import fetchJson from '../../../utils/fetch-json.js';

export default class Page {
  element;
  subElements = {};
  components = {};
  sliderStartParams = {min: 0, max: 4000};


  get template () {
    return `
    <div class="products-list">
      <div class="content__top-panel">
        <h1 class="page-title">Товары</h1>
        <a href="/products/add" class="button-primary">Добавить товар</a>
      </div>
      <div class="content-box content-box_small">
        <form class="form-inline">
          <div class="form-group">
            <label class="form-label">Сортировать по:</label>
            <input type="text" data-element="filterName" class="form-control" placeholder="Название товара">
          </div>
          <div class="form-group" data-element="sliderContainer">
            <label class="form-label">Цена:</label>
          </div>
          <div class="form-group">
            <label class="form-label">Статус:</label>
            <select class="form-control" data-element="filterStatus">
              <option value="" selected="">Любой</option>
              <option value="1">Активный</option>
              <option value="0">Неактивный</option>
            </select>
          </div>
        </form>
      </div>
      <div data-element="sortableTable" class="products-list__container"></div>
    </div>
    `;
  }

  async updateTableComponent (from, to) {
    const sorted = this.components.sortableTable.sorted;
    
    this.components.sortableTable.start = 1;
    this.components.sortableTable.end = this.components.sortableTable.start + this.components.sortableTable.step;
    this.components.sortableTable.url.searchParams.set('price_gte', from);
    this.components.sortableTable.url.searchParams.set('price_lte', to);

    const data = await this.components.sortableTable.loadData(sorted.id, sorted.order, 1, 21);

    this.components.sortableTable.renderRows(data);
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.initComponents();

    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  initComponents() {
    const sortableTable = new SortableTable(header, {
      url: `/api/rest/products?_embed=subcategory.category`,
      sorted: {id: 'title', order: 'asc'},
      rowsAsLink: {base_link: '/products/', item: 'id'},
      isSortLocally: false,
      start: 1
    });

    const slider = new DoubleSlider(this.sliderStartParams);

    this.components.sortableTable = sortableTable;
    this.components.sliderContainer = slider;
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];

      root.append(element);
    });  
  }

  initEventListeners () {
    this.components.sliderContainer.element.addEventListener('range-select', event => {
      const { from, to } = event.detail;
      this.updateTableComponent(from, to);
    });

    this.subElements.filterStatus.addEventListener('change', event => this.dropMenuChange(event));
    this.subElements.filterName.addEventListener('input', event => this.productNameInput(event));

    this.components.sortableTable.subElements.emptyPlaceholder.querySelector('button').addEventListener('pointerdown', this.clearFilters);
  }

  dropMenuChange ({target}) {
    const {from, to} = this.components.sliderContainer.getValue();
    
    if (target.value) {
      this.components.sortableTable.url.searchParams.set('status', target.value);
    } else {
      this.components.sortableTable.url.searchParams.delete('status');
    }

    this.updateTableComponent(from, to);
  }

  productNameInput = ({target}) => {
    if (target.value) {
      this.components.sortableTable.url.searchParams.set('title_like', target.value);
    } else {
      this.components.sortableTable.url.searchParams.delete('title_like');
    }

    const {from, to} = this.components.sliderContainer.getValue();
    this.updateTableComponent(from, to);    
  }

  clearFilters = () => {
    this.components.sliderContainer.min = this.sliderStartParams.min;
    this.components.sliderContainer.max = this.sliderStartParams.max;
    this.components.sliderContainer.setLimits('from', this.sliderStartParams.min);
    this.components.sliderContainer.setLimits('to', this.sliderStartParams.max);
    this.components.sliderContainer.update();
    
    this.subElements.filterStatus.selectedIndex = 0;
    this.components.sortableTable.url.searchParams.delete('status');
    
    this.subElements.filterName.value = '';
    this.components.sortableTable.url.searchParams.delete('title_like');

    const {from, to} = this.components.sliderContainer.getValue();

    this.updateTableComponent(from, to);
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
