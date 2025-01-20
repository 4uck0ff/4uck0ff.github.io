let articles = []; // Массив для хранения всех статей
let currentPage = 1; // Текущая страница
const articlesPerPage = 5; // Количество статей на одной странице

// Массив для хранения отфильтрованных статей по поиску
let filteredArticles = [];

async function loadExcelFile() {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`./data/base.xlsx?nocache=${timestamp}`);

    if (!response.ok) {
      throw new Error('Не удалось загрузить файл Excel');
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const range = worksheet['!ref'];
    const lastRow = XLSX.utils.decode_range(range).e.r;

    // Сохраняем статьи в массив
    articles = [];
    for (let i = 1; i <= lastRow; i++) {
      const title = worksheet[`A${i}`] ? worksheet[`A${i}`].v : 'Без названия';
      const date = worksheet[`B${i}`] ? worksheet[`B${i}`].v : 'Не указана';
      const content = worksheet[`C${i}`] ? worksheet[`C${i}`].v : 'Нет текста';
      const imagePath = worksheet[`D${i}`] ? worksheet[`D${i}`].v : 'nophoto.jpg';
      articles.push({ title, date, content, imagePath: imagePath.replace(/\\/g, '/') });
    }

    articles.reverse(); // Переворачиваем порядок статей

    renderArticles(); // Отображаем статьи на первой странице
    renderPagination(); // Отображаем селектор страниц
  } catch (error) {
    console.error('Ошибка при загрузке или обработке файла:', error);
    document.getElementById('newsContainer').textContent = 'Ошибка при загрузке файла.';
  }
}

// Функция для отображения статей текущей страницы
function renderArticles() {
  const newsContainer = document.getElementById('newsContainer');
  newsContainer.innerHTML = ''; // Очищаем контейнер

  const articlesToRender = filteredArticles.length > 0 ? filteredArticles : articles;

  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = Math.min(startIndex + articlesPerPage, articlesToRender.length);

  for (let i = startIndex; i < endIndex; i++) {
    const { title, date, content, imagePath } = articlesToRender[i];
    const articleHTML = `
      <div class="row newsCont">
        <div class="row newsTitle">
          <span>${title}</span>
        </div>
        <div class="row newsDate">
          <span>${date}</span>
        </div>
        <div class="row newsText">
          <div class="col-9">
            <span class="newsText"><p>${content}</p></span>
          </div>
          <div class="col-3 text-center justify-content-center align-content-center">
            <img class="newsImage" src="../${imagePath}" alt="${title}">
          </div>
        </div>
      </div>
    `;
    newsContainer.insertAdjacentHTML('beforeend', articleHTML);
  }
}

// Функция для отображения селектора страниц
function renderPagination() {
  // Получаем контейнеры для пагинации
  const paginationTop = document.getElementById('paginationTop');
  const paginationBottom = document.getElementById('paginationBottom');
  paginationTop.innerHTML = '';
  paginationBottom.innerHTML = '';

  // Вычисляем общее количество страниц
  const articlesToRender = filteredArticles.length > 0 ? filteredArticles : articles;
  const totalPages = Math.ceil(articlesToRender.length / articlesPerPage);

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

// Функция для смены страницы
function changePage(pageNumber) {
  currentPage = pageNumber;
  renderArticles();
  renderPagination();

  // Прокрутка наверх страницы
  window.scrollTo({
    top: 0, // Указываем координату Y для прокрутки
    behavior: 'smooth' // Добавляем плавную анимацию
  });
}

// Функция для поиска статей
function searchArticles() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery)
  );

  // Получаем контейнер для сообщения
  const noResultsMessageContainer = document.getElementById('searchnoresult');

  // Если нет результатов поиска
  if (filteredArticles.length === 0) {
    if (!noResultsMessageContainer.innerHTML) {
      noResultsMessageContainer.textContent = 'Нет результатов по вашему запросу.';
      noResultsMessageContainer.style.color = 'red'; // Можете добавить стили по желанию
      noResultsMessageContainer.style.marginTop = '20px';
    }
  } else {
    // Если результаты есть, очищаем сообщение
    noResultsMessageContainer.textContent = '';
  }

  // Перерисовываем статьи и пагинацию
  renderArticles();
  renderPagination();
}


  // Сбрасываем текущую страницу и перерисовываем
  currentPage = 1;
  renderArticles();
  renderPagination();


// Функция для сброса поиска
function resetSearch() {
  document.getElementById('searchInput').value = ''; // Очищаем поле ввода
  filteredArticles = []; // Очищаем фильтрацию
  currentPage = 1; // Сбрасываем текущую страницу
  renderArticles();
  renderPagination();
}

// Запускаем загрузку при загрузке страницы
document.addEventListener('DOMContentLoaded', loadExcelFile);

// Добавляем обработчики для поиска и сброса
document.getElementById('searchButton').addEventListener('click', searchArticles);
document.getElementById('resetButton').addEventListener('click', resetSearch);
