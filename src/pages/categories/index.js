import SortableList from '../../components/sortable-list/index.js';
import NotificationMessage from '../../components/notification/index.js';

import fetchJson from '../../utils/fetch-json.js';

export default class Page {
  element;
  subElements = {};
  components = {};
    
  get template () {
    return `
    <div class="categories">
        <div class="content__top-panel">
            <h1 class="page-title">Категории товаров</h1>
        </div>
        <div data-element="categoriesContainer"></div>
    </div>`;
  }

  async getAllCategories () {
    const catList = await fetchJson('https://course-js.javascript.ru/api/rest/categories?_sort=weight&_refs=subcategory');

    this.categories = catList;
    return catList;
  }

  getCategory() {
    return this.categories.map(item => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
        <div class="category category_open" data-id="${item.id}">
          <header class="category__header">
            ${item.title}
          </header>
          <div class="category__body">
            <div class="subcategory-list"></div>
          </div>
        </div>`;

        wrapper.querySelector('.subcategory-list').append(this.components[item.id].element);
        return wrapper.firstElementChild;
    });
  }

  getSubCategories (data = []) {
    return data.map(item => {
        const li = document.createElement('li');

        li.classList.add('categories__sortable-list-item', 'sortable-list__item');
        li.setAttribute('data-grab-handle', '');
        li.setAttribute('data-id', item.id);
        li.innerHTML = `<strong>${item.title}</strong>
          <span><b>${item.count}</b> products</span>`;
        
        return li;
    });
  }

  async initComponents () {
    await this.getAllCategories();

    this.components = this.categories.reduce((lists, category) => {
        lists[category.id] = new SortableList({items: this.getSubCategories(category.subcategories)});
        return lists;
    }, {});

    const notification = new NotificationMessage('Category order saved');
    
    this.components.notificationMessage = notification;
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.initComponents();

    this.subElements.categoriesContainer.append(...this.getCategory());
    this.initEventListeners();

    return this.element;
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  async saveNewOrder ({target}) {
    const subcategories = this.getSubcategoriesOrder(target);
    
    const result = await fetchJson(`${process.env.BACKEND_URL}api/rest/subcategories`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subcategories)
    });

    this.showNotification();
  }

  getSubcategoriesOrder (ulElement) {
    return Array.of(...ulElement.childNodes).map((element, index) => {
      return {
        id: element.dataset.id,
        weight: index + 1
      };
    });
  }

  showNotification () {
    this.components.notificationMessage.element.style.position = 'fixed';

    const height = document.documentElement.clientHeight;
    const width = document.documentElement.clientWidth;

    this.components.notificationMessage.element.style.left = width - 250 + 'px';
    this.components.notificationMessage.element.style.top = height - 100 + 'px';

    this.components.notificationMessage.show();
  }

  initEventListeners () {
    this.subElements.categoriesContainer.addEventListener('sortable-list-reorder', event => {
      this.saveNewOrder(event);  
    });
    
    this.subElements.categoriesContainer.querySelectorAll('div > header').forEach(element => element.addEventListener('pointerdown', event => {
      event.target.closest('div').classList.toggle('category_open');
    }));    
  }

  destroy () {
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}