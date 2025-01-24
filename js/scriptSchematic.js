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

    // Добавляем вызов populateFilters после успешной загрузки данных
    populateFilters();
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
        <div class="col-md-3 col-xs-1 imageXS">
          <div class="row schematicImageCont">
            <img class="schematicImage" src="./${images[0]}" alt="${title}">
          </div>
        </div>
        <div class="col-xs-5 priceXs text-center align-content-center">
          ${price} BYN
        </div>
        <div class="col-md-9 col-xs-12 mainFont">
          <div class="row schematicTitle">${title}</div>
          <div class="row schematicName">${brand} / ${model} / ${year}</div>
          <div class="row schematicNumber">${partNumber}</div>
          <div class="row">
            <div class="col-8  schematicArticle">Артикул ${article}</div>
            <div class="col-md-4 col-xs-12  schematicPrice">${price} BYN</div>
          </div>
          <div class="row schematicDate">${date}</div>
        </div>
      </div>

      <div id="${popupId}" class="mfp-hide">
        <div class="popup-gallery">
          <div class="popUpCont container">
            <div class="row">
              <h2 class="schematicTitle">${title} ${brand} / ${model} / ${year}</h2>
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
            <div class="row schematicNumber">Номер: ${partNumber}</div>
            <div class="row">
              <div class="col-8 schematicArticle">Артикул: ${article}</div>
              <div class="col-4 schematicPrice">${price} BYN</div>
            </div>
            <div class="row">
              <div class="col imagesPopupDescription">${description}</div>
            </div>
            <form class="contact-form" method="POST" action="send.php">
            <div class="row popUpInputCont">
              <div class="col-md-7 col-xs-12 align-content-center imagesPopupDescription">
               <input type="email" name="email" class="inputEmail" placeholder="example@email.com" required>
              </div>
              <div class="col-md-4 col-xs-12 align-content-center inputPopUpTextDescription" class="popUpInputDescription">
                Ваша электронная почта
              </div>
            </div>
            <div class="row popUpInputCont">
              <div class="col-md-7 col-xs-12 align-content-center text-center imagesPopupDescription">
               <input type="text" name="article" class="inputArticle" placeholder="article" value="${article}" required>
              </div>
              <div class="col-md-4 col-xs-12 align-content-center inputPopUpTextDescription" class="popUpInputDescription">
                Артикул детали (введён автоматически)
              </div>
            </div>
            <div class="row popUpInputCont">
              <div class="col-md-7 col-xs-12 align-content-center imagesPopupDescription">
               <input type="tel" name="tel" input-type="tel" class="inputPhone" placeholder="+375XXXXXXXXX" required>
              </div>
              <div class="col-md-4 col-xs-12 align-content-center inputPopUpTextDescription" class="popUpInputDescription">
                Нужен для обратной связи
              </div>
            </div>
            <div class="row popUpInputCont">
              <div class="col-md-7 col-xs-12 align-content-center text-center imagesPopupDescription">
               <button class="popUpButton" type="submit" name="button">Отправить</button>
              </div>
              <div class="col-md-4 col-xs-12 align-content-center inputPopUpTextDescription" class="popUpInputDescription">
                После отправки, к Вам на почту придет письмо с дальнейшими инструкциями
              </div>
            </div>
            </form>
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
  // Получаем контейнеры для пагинации
  const paginationTop = document.getElementById('paginationTop');
  const paginationBottom = document.getElementById('paginationBottom');
  paginationTop.innerHTML = '';
  paginationBottom.innerHTML = '';

  // Вычисляем общее количество страниц
  const schematicsToRender = filteredSchematics.length > 0 ? filteredSchematics : schematics;
  const totalPages = Math.ceil(schematicsToRender.length / schematicsPerPage);

  if (totalPages <= 1) return; // Если страниц <= 1, ничего не отображаем

  // Функция для создания селектора страниц
  function createPaginationControls() {
    const paginationHTML = document.createElement('div');
    paginationHTML.classList.add('pagination'); // Добавляем общий класс для контейнера

    // Кнопка "Назад"
    const prevButton = document.createElement('button');
    prevButton.textContent = '<';
    prevButton.classList.add('pagination-button', 'pagination-prev'); // Классы для кнопки
    prevButton.disabled = currentPage === 1;
    if (prevButton.disabled) prevButton.classList.add('disabled'); // Класс для отключённой кнопки
    prevButton.addEventListener('click', () => changePage(currentPage - 1));
    paginationHTML.appendChild(prevButton);

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Первая страница
        i === totalPages || // Последняя страница
        (i >= currentPage - 2 && i <= currentPage + 2) // Текущая страница и соседние
      ) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('pagination-button', 'pagination-page'); // Классы для номера страницы
        if (i === currentPage) pageButton.classList.add('active'); // Класс для активной страницы
        pageButton.disabled = i === currentPage;
        pageButton.addEventListener('click', () => changePage(i));
        paginationHTML.appendChild(pageButton);
      } else if (
        (i === currentPage - 3 && currentPage > 4) || // Многоточие перед
        (i === currentPage + 3 && currentPage < totalPages - 3) // Многоточие после
      ) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.classList.add('pagination-ellipsis'); // Класс для многоточия
        paginationHTML.appendChild(ellipsis);
      }
    }

    // Кнопка "Вперёд"
    const nextButton = document.createElement('button');
    nextButton.textContent = '>';
    nextButton.classList.add('pagination-button', 'pagination-next'); // Классы для кнопки
    nextButton.disabled = currentPage === totalPages;
    if (nextButton.disabled) nextButton.classList.add('disabled'); // Класс для отключённой кнопки
    nextButton.addEventListener('click', () => changePage(currentPage + 1));
    paginationHTML.appendChild(nextButton);

    return paginationHTML;
  }

  // Вставляем созданный селектор в оба контейнера
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

  // Проверяем наличие данных в массиве schematics
  if (!Array.isArray(schematics) || schematics.length === 0) {
    console.error('Массив schematics пуст или не определен.');
    return;
  }

  // Извлекаем уникальные марки из массива схем
  const uniqueBrands = [...new Set(schematics.map((s) => s.brand).filter((brand) => brand))].sort();

  // Добавляем марки в фильтр
  uniqueBrands.forEach((brand) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });

  // Слушатель для изменения бренда
  brandFilter.addEventListener('change', () => {
    const selectedBrand = brandFilter.value;

    // Фильтруем модели по выбранному бренду
    const filteredModels = schematics
      .filter((s) => selectedBrand === '' || s.brand === selectedBrand)
      .map((s) => s.model)
      .filter((model) => model);

    // Получаем уникальные модели
    const uniqueModels = [...new Set(filteredModels)].sort();

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

    // Обновляем список годов при выборе модели
    updateYearFilter(selectedBrand, modelFilter.value);
  });

  // Слушатель для изменения модели
  modelFilter.addEventListener('change', () => {
    updateYearFilter(brandFilter.value, modelFilter.value);
  });

  // Начальная инициализация года
  updateYearFilter('', '');
}

function updateYearFilter(selectedBrand, selectedModel) {
  const yearFilter = document.getElementById('yearFilter');

  // Фильтруем годы по выбранным марке и модели
  const filteredYears = schematics
    .filter((s) =>
      (selectedBrand === '' || s.brand === selectedBrand) &&
      (selectedModel === '' || s.model === selectedModel)
    )
    .map((s) => s.year)
    .filter((year) => year);

  // Получаем уникальные годы
  const uniqueYears = [...new Set(filteredYears)].sort((a, b) => a - b);

  // Добавляем годы в фильтр
  yearFilter.innerHTML = '<option value="">Все года</option>';
  uniqueYears.forEach((year) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
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
    const matchesPartNumber =
      partNumberQuery === '' ||
      (schematic.partNumber && schematic.partNumber.toString().toLowerCase().includes(partNumberQuery));

    return matchesTitle && matchesBrand && matchesModel && matchesYear && matchesPartNumber;
  });

  currentPage = 1;
  renderSchematics(); // Перерисовываем схемы после поиска
  renderPagination(); // Перерисовываем пагинацию

  // Если нет отфильтрованных схем, показываем сообщение
  const noSearchResult = document.getElementById('noSearchResultS');
  if (filteredSchematics.length === 0) {
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
    document.getElementById('noSearchResultS').style.display = 'none';

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
    const fullSizeImageContainer = document.createElement('div'); // Контейнер для изображения
    fullSizeImageContainer.id = 'full-size-container';
    document.body.appendChild(fullSizeImageContainer);

    const img = document.createElement('img'); // Увеличенное изображение
    img.id = 'full-size-image';
    fullSizeImageContainer.appendChild(img);

    // Кнопка закрытия
    const closeButton = document.createElement('button');
    closeButton.id = 'close-btn';
    closeButton.innerHTML = '&times;';
    fullSizeImageContainer.appendChild(closeButton);

    let scale = 1; // Масштаб изображения
    let isDragging = false; // Флаг перетаскивания
    let startX, startY; // Начальные координаты мыши
    let imgX = 0, imgY = 0; // Смещение изображения

    // Добавление обработчиков кликов на изображения
    function attachClickHandlers() {
        const images = document.querySelectorAll('.gallery-item');
        images.forEach((image) => {
            if (!image.dataset.processed) {
                image.dataset.processed = "true";
                image.addEventListener('click', function () {
                    img.src = image.src;
                    img.alt = image.alt;
                    scale = 1; // Сбрасываем масштаб
                    img.style.transform = `translate(0px, 0px) scale(1)`;
                    imgX = 0;
                    imgY = 0;
                    fullSizeImageContainer.classList.add('active');
                });
            }
        });
    }

    // Закрытие изображения
    closeButton.addEventListener('click', function () {
        fullSizeImageContainer.classList.remove('active');
    });

    // Увеличение/уменьшение колесиком мыши
    img.addEventListener('wheel', function (event) {
        event.preventDefault();
        const zoomIntensity = 0.1;
        scale += event.deltaY < 0 ? zoomIntensity : -zoomIntensity;
        scale = Math.min(Math.max(scale, 0.5), 3); // Ограничение масштаба
        img.style.transform = `translate(${imgX}px, ${imgY}px) scale(${scale})`;
    });

    // Перетаскивание изображения
    img.addEventListener('mousedown', function (event) {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
    });

    document.addEventListener('mousemove', function (event) {
        if (isDragging) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            imgX += dx;
            imgY += dy;
            img.style.transform = `translate(${imgX}px, ${imgY}px) scale(${scale})`;
            startX = event.clientX;
            startY = event.clientY;
        }
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });

    // Отслеживание изменений DOM
    const observer = new MutationObserver(attachClickHandlers);
    observer.observe(document.body, { childList: true, subtree: true });

    // Первый вызов для существующих элементов
    attachClickHandlers();
});
