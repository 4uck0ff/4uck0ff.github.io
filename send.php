<?php
// Проверяем, был ли запрос методом POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Получаем данные из формы
    $email = isset($_POST['email']) ? htmlspecialchars($_POST['email']) : null;
    $article = isset($_POST['article']) ? htmlspecialchars($_POST['article']) : null;
    $tel = isset($_POST['tel']) ? htmlspecialchars($_POST['tel']) : null;

    // Проверка на пустые поля
    if (empty($email) || empty($article) || empty($tel)) {
        echo "Ошибка: Все поля формы должны быть заполнены.";
        exit;
    }

    // Проверка email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Ошибка: Некорректный email.";
        exit;
    }

    // Проверка телефона на формат +375XXXXXXXXX
    if (!preg_match('/^\+375(17|25|29|33|44)[0-9]{7}$/', $tel)) {
        echo "Ошибка: Номер телефона должен быть в формате +375XXXXXXXXX.";
        exit;
    }

    // Настройка email
    $to = "order@retun.by"; // Укажи свой email
    $subject = "Новая заявка: $article";
    $body = "Поступила новая заявка:\n\n"
          . "Email: $email\n"
          . "Артикул: $article\n"
          . "Телефон: $tel";
    $headers = "From: $email";

    // Отправка email
    if (mail($to, $subject, $body, $headers)) {
        echo "Сообщение успешно отправлено!";
    } else {
        echo "Ошибка: Не удалось отправить сообщение.";
    }
} else {
    echo "Ошибка: Некорректный метод запроса.";
}
