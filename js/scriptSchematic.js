let schematics = []; // Массив для хранения всех схем
let currentPage = 1; // Текущая страница
const schematicsPerPage = 5; // Количество схем на одной странице

// Массив для хранения отфильтрованных схем
let filteredSchematics = [];

async function loadExcelFile() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`./data/schematics.xlsx?nocache=${timestamp}`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить файл Excel');
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const range = worksheet['!ref'];
    const lastRow = XLSX.utils.decode_range(range).e.r;

    schematics = [];
    for (let i = 1; i <= lastRow; i++) {
      const title = worksheet[`A${i}`] ? worksheet[`A${i}`].v : 'Без названия';
      const brand = worksheet[`B${i}`] ? worksheet[`B${i}`].v : 'Не указано';
      const model = worksheet[`C${i}`] ? worksheet[`C${i}`].v : 'Не указано';
      const year = worksheet[`D${i}`] ? worksheet[`D${i}`].v : 'Не указан';
      const partNumber = worksheet[`E${i}`] ? worksheet[`E${i}`].v : 'Не указан';
      const article = worksheet[`F${i}`] ? worksheet[`F${i}`].v : 'Не указан';
      const price = worksheet[`G${i}`] ? worksheet[`G${i}`].v : 'Цена не указана';
      const date = worksheet[`H${i}`] ? worksheet[`H${i}`].v : 'Не указана';
      const image1 = worksheet[`I${i}`] ? worksheet[`I${i}`].v : 'images/nophoto.jpg';
      const image2 = worksheet[`J${i}`] ? worksheet[`J${i}`].v : 'images/nophoto.jpg';
      const image3 = worksheet[`K${i}`] ? worksheet[`K${i}`].v : 'images/nophoto.jpg';
      const description = worksheet[`L${i}`] ? worksheet[`L${i}`].v : 'Нет описания';

      schematics.push({
        title,
        brand,
        model,
        year,
        partNumber,
        article,
        price,
        date,
        images: [image1, image2, image3],
        description,
      });
    }

    schematics.reverse(); // Переворачиваем порядок

    renderSchematics(); // Отображаем схемы
    renderPagination(); // Отображаем селектор страниц
  } catch (error) {
    console.error('Ошибка при загрузке или обработке файла:', error);
    document.getElementById('schematicAdd').textContent = 'Ошибка при загрузке файла.';
  }
}

// Функция для отображения схем текущей страницы
function renderSchematics() {
  const schematicContainer = document.getElementById('schematicAdd');
  schematicContainer.innerHTML = ''; // Очищаем контейнер

  const schematicsToRender = filteredSchematics.length > 0 ? filteredSchematics : schematics;

  const startIndex = (currentPage - 1) * schematicsPerPage;
  const endIndex = Math.min(startIndex + schematicsPerPage, schematicsToRender.length);

  for (let i = startIndex; i < endIndex; i++) {
    const {
      title,
      brand,
      model,
      year,
      partNumber,
      article,
      price,
      date,
      images,
      description,
    } = schematicsToRender[i];

    const popupId = `popup-content-${i}`;

    // Карточка схемы
    const schematicHTML = `
      <div class="row schematicCont open-popup" data-popup-id="${popupId}">
        <div class="col-3">
          <div class="row schematicImageCont">
            <img class="schematicImage" src="./${images[0]}" alt="${title}">
          </div>
        </div>
        <div class="col-9 mainFont">
          <div class="row schematicTitle">${title}</div>
          <div class="row schematicName">${brand} / ${model} / ${year}</div>
          <div class="row schematicNumber">${partNumber}</div>
          <div class="row schematicArticle">
            <div class="col-8">${article}</div>
            <div class="col-4 schematicPrice">${price}</div>
          </div>
          <div class="row schematicDate">${date}</div>
        </div>
      </div>

      <div id="${popupId}" class="mfp-hide">
        <div class="popup-gallery">
          <div class="popUpCont container">
            <div class="row">
              <h2 class="popupTitle">Галерея изображений</h2>
            </div>
            <div class="row">
              ${images
                .map(
                  (img, idx) => `
                    <div class="col-4 text-center">
                      <img class="gallery-item imagesInsidePopUp" src="./${img}" alt="Image ${idx + 1}">
                    </div>
                  `
                )
                .join('')}
            </div>
            <div class="row">
              <div class="col imagesPopupDescription">${description}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    schematicContainer.insertAdjacentHTML('beforeend', schematicHTML);
  }

  initializePopups();
}

// Функция для инициализации всплывающих окон
function initializePopups() {
  document.querySelectorAll('.open-popup').forEach((element) => {
    const popupId = element.getAttribute('data-popup-id');
    $(element).magnificPopup({
      items: { src: `#${popupId}`, type: 'inline' },
      closeBtnInside: true,
    });
  });
}

// Функция для отображения селектора страниц
function renderPagination() {
  const paginationTop = document.getElementById('paginationTop');
  const paginationBottom = document.getElementById('paginationBottom');
  paginationTop.innerHTML = '';
  paginationBottom.innerHTML = '';

  const schematicsToRender = filteredSchematics.length > 0 ? filteredSchematics : schematics;
  const totalPages = Math.ceil(schematicsToRender.length / schematicsPerPage);

  if (totalPages <= 1) return;

  function createPaginationControls() {
    const paginationHTML = document.createElement('div');
    paginationHTML.classList.add('pagination');

    const prevButton = document.createElement('button');
    prevButton.textContent = '<';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    paginationHTML.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      if (i === currentPage) pageButton.classList.add('active');
      pageButton.addEventListener('click', () => changePage(i));
      paginationHTML.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = '>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
    paginationHTML.appendChild(nextButton);

    return paginationHTML;
  }

  paginationTop.appendChild(createPaginationControls());
  paginationBottom.appendChild(createPaginationControls());
}

function changePage(pageNumber) {
  currentPage = pageNumber;
  renderSchematics();
  renderPagination();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


function populateFilters() {
  const brandFilter = document.getElementById('brandFilter');
  const modelFilter = document.getElementById('modelFilter');
  const yearFilter = document.getElementById('yearFilter');

  // Убираем любые предыдущие элементы фильтров
  brandFilter.innerHTML = '<option value="">Все марки</option>';
  modelFilter.innerHTML = '<option value="">Все модели</option>';
  yearFilter.innerHTML = '<option value="">Все года</option>';

  // Извлекаем уникальные марки и годы из массива схем
  const uniqueBrands = [...new Set(schematics.map((s) => s.brand).filter((brand) => brand !== ''))];
  const uniqueYears = [...new Set(schematics.map((s) => s.year).filter((year) => year !== ''))];

  // Выводим уникальные марки и года во всплывающее окно
  showAlertWithData(uniqueBrands, uniqueYears);

  // Добавляем марки в фильтр
  uniqueBrands.forEach((brand) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });

  // Добавляем года в фильтр
  uniqueYears.forEach((year) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  // Слушатель для изменения бренда
  brandFilter.addEventListener('change', () => {
    const selectedBrand = brandFilter.value;

    // Фильтруем модели по выбранному бренду
    const filteredModels = selectedBrand
      ? schematics.filter((s) => s.brand === selectedBrand).map((s) => s.model)
      : [];

    // Получаем уникальные модели
    const uniqueModels = [...new Set(filteredModels)];

    // Добавляем модели в фильтр
    modelFilter.innerHTML = '<option value="">Все модели</option>';
    uniqueModels.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelFilter.appendChild(option);
    });

    // Ожидаем, что если моделей нет, нужно заблокировать фильтр модели
    modelFilter.disabled = uniqueModels.length === 0;
  });
}

// Функция для отображения информации во всплывающем окне
function showAlertWithData(brands, years) {
  const brandsText = brands.length > 0 ? `Уникальные марки:\n${brands.join('\n')}` : 'Нет марок';
  const yearsText = years.length > 0 ? `Уникальные года:\n${years.join('\n')}` : 'Нет годов';

  // Выводим информацию в стандартное всплывающее окно браузера
  alert(`${brandsText}\n\n${yearsText}`);
}




function searchSchematics() {
  const titleQuery = document.getElementById('searchSchematic').value.toLowerCase();
  const brandQuery = document.getElementById('brandFilter').value;
  const modelQuery = document.getElementById('modelFilter').value;
  const yearQuery = document.getElementById('yearFilter').value;
  const partNumberQuery = document.getElementById('partNumberFilter').value.toLowerCase();

  filteredSchematics = schematics.filter((schematic) => {
    const matchesTitle = titleQuery === '' || schematic.title.toLowerCase().includes(titleQuery);
    const matchesBrand = brandQuery === '' || schematic.brand === brandQuery;
    const matchesModel = modelQuery === '' || schematic.model === modelQuery;
    const matchesYear = yearQuery === '' || schematic.year.toString() === yearQuery;
    const matchesPartNumber = partNumberQuery === '' || schematic.partNumber.toLowerCase().includes(partNumberQuery);

    return matchesTitle && matchesBrand && matchesModel && matchesYear && matchesPartNumber;
  });

  currentPage = 1;
  renderSchematics(); // Перерисовываем схемы после поиска
  renderPagination(); // Перерисовываем пагинацию

  // Если нет отфильтрованных схем, показываем сообщение
  const noSearchResult = document.getElementById('nosearchresult');
  if (filteredSchematics.length === 0) {
    noSearchResult.textContent = 'Ничего не найдено по вашему запросу';
    noSearchResult.style.display = 'block'; // Показываем сообщение
  } else {
    noSearchResult.style.display = 'none'; // Скрываем сообщение
  }
}

function initializeSearch() {
  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', searchSchematics);

  const resetButton = document.getElementById('resetButton');
  resetButton.addEventListener('click', () => {
    document.getElementById('searchSchematic').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('modelFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('partNumberFilter').value = '';

    filteredSchematics = [];
    currentPage = 1;
    renderSchematics();
    renderPagination();
  });
}

function resetSearch() {
  document.getElementById('searchSchematic').value = '';
  document.getElementById('brandFilter').value = '';
  document.getElementById('modelFilter').value = '';
  document.getElementById('yearFilter').value = '';
  document.getElementById('partNumberFilter').value = '';

  filteredSchematics = [];
  currentPage = 1;
  renderSchematics();
  renderPagination();
}

document.addEventListener('DOMContentLoaded', loadExcelFile);
document.getElementById('searchButton').addEventListener('click', searchSchematics);
document.getElementById('resetButton').addEventListener('click', resetSearch);




  document.addEventListener("DOMContentLoaded", function () {
      const images = document.querySelectorAll('.gallery-item'); // Все изображения
      const fullSizeImage = document.createElement('img'); // Создадим элемент для увеличенного изображения
      fullSizeImage.id = 'full-size-image'; // Добавим ID для этого элемента
      document.body.appendChild(fullSizeImage); // Вставим его в body

      // Создаем кнопку для закрытия изображения
      const closeButton = document.createElement('button');
      closeButton.id = 'close-btn';
      closeButton.innerHTML = '&times;'; // Символ для крестика
      fullSizeImage.appendChild(closeButton); // Добавляем кнопку внутрь увеличенного изображения

      images.forEach((image) => {
          image.addEventListener('click', function () {
              // Проверяем, если изображение уже открыто
              if (fullSizeImage.classList.contains('active') && fullSizeImage.src === image.src) {
                  // Закрываем увеличенное изображение
                  fullSizeImage.classList.remove('active');
              } else {
                  // Открываем изображение в полный размер
                  fullSizeImage.src = image.src; // Устанавливаем путь к изображению
                  fullSizeImage.alt = image.alt; // Устанавливаем alt-текст
                  fullSizeImage.classList.add('active'); // Делаем изображение видимым
              }
          });
      });

      // Закрытие изображения при клике на него
      fullSizeImage.addEventListener('click', function (event) {
          // Не закрывать изображение при клике на саму картинку
          if (event.target === fullSizeImage) {
              fullSizeImage.classList.remove('active');
          }
      });

      // Закрытие изображения при клике на кнопку (крестик)
      closeButton.addEventListener('click', function () {
          fullSizeImage.classList.remove('active');
      });
  });
