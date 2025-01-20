async function loadExcelFile() {
  try {
    // Загружаем файл base.xlsx
    const response = await fetch('./data/base.xlsx');
    if (!response.ok) {
      throw new Error('Не удалось загрузить файл Excel');
    }

    const arrayBuffer = await response.arrayBuffer();

    // Читаем файл как книгу Excel
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Получаем первый лист
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Ищем количество строк в таблице
    const range = worksheet['!ref']; // Получаем диапазон
    const lastRow = XLSX.utils.decode_range(range).e.r; // Получаем номер последней строки

    // Получаем контейнер для новостей
    const newsContainer = document.getElementById('newsContainer');

    // Обрабатываем все строки с данными
    for (let i = lastRow; i >= 1; i--) { // Обратный порядок
      const title = worksheet[`A${i}`] ? worksheet[`A${i}`].v : '';
      const date = worksheet[`B${i}`] ? worksheet[`B${i}`].v : '';
      const content = worksheet[`C${i}`] ? worksheet[`C${i}`].v : '';
      const imagePath = worksheet[`D${i}`] ? worksheet[`D${i}`].v : '';

      // Создаем новый блок для статьи
      const articleDiv = document.createElement('div');
      articleDiv.classList.add('article'); // Добавляем класс для стилизации

      // Добавляем заголовок статьи
      const titleElement = document.createElement('h2');
      titleElement.textContent = title;
      articleDiv.appendChild(titleElement);

      // Добавляем дату статьи
      const dateElement = document.createElement('p');
      dateElement.textContent = `Дата: ${date}`;
      articleDiv.appendChild(dateElement);

      // Добавляем картинку
      if (imagePath) {
        const imgElement = document.createElement('img');
        imgElement.src = `../${imagePath.replace(/\\/g, '/')}`;
        imgElement.alt = `Изображение статьи "${title}"`;
        imgElement.style.maxWidth = '300px'; // Ограничение на размер изображения
        articleDiv.appendChild(imgElement);
      }

      // Добавляем текст статьи
      const contentElement = document.createElement('p');
      contentElement.textContent = content;
      articleDiv.appendChild(contentElement);

      // Добавляем статью в контейнер
      newsContainer.appendChild(articleDiv);
    }

  } catch (error) {
    console.error('Ошибка при загрузке или обработке файла:', error);
    document.getElementById('newsContainer').textContent = 'Ошибка при загрузке файла.';
  }
}

// Запускаем загрузку при загрузке страницы
document.addEventListener('DOMContentLoaded', loadExcelFile);
