async function loadExcelFile() {
  try {
    // Загружаем файл base.xlsx
    const response = await fetch('../data/base.xlsx');
    if (!response.ok) {
      throw new Error('Не удалось загрузить файл Excel');
    }

    const arrayBuffer = await response.arrayBuffer();

    // Читаем файл как книгу Excel
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Получаем первый лист
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Извлекаем значение ячейки A1
    const cellValue = worksheet['A1'] ? worksheet['A1'].v : 'Ячейка A1 пуста';

    // Отображаем данные на странице
    document.getElementById('excelData').textContent = cellValue;
  } catch (error) {
    console.error('Ошибка при загрузке или обработке файла:', error);
    document.getElementById('excelData').textContent = 'Ошибка при загрузке файла.';
  }
}

// Запускаем загрузку при загрузке страницы
document.addEventListener('DOMContentLoaded', loadExcelFile);
