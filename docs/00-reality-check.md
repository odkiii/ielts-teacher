# 00. Reality check: факты, цифры, ограничения

Дата проверки: 2026-10-29. Всё, что ниже помечено [S], подтверждено источником из списка внизу; [E] — моя оценка/вывод.

## 1. Сколько это реально займёт

- Cambridge: примерно **200 учебных часов (guided learning hours) на переход на следующий уровень CEFR** [S1].
- IELTS 4.5 ≈ B1; 7.0–7.5 ≈ C1 [E: стандартное соответствие, сверь с официальной таблицей перед использованием в отчётах]. Значит минимум ~2 уровня ≈ **400+ часов осмысленной учёбы**. Вторичные источники дают 200–300 часов на 1.0 балл IELTS [S2, нижняя достоверность].
- Самоподготовка без преподавателя неэффективнее → закладываем коэффициент 1.5–2 [E]. Итого **600–800 часов**.
- План: **12–14 ч/неделю × 52 недели ≈ 620–730 ч** (+ запас 6 месяцев). Это согласуется с горизонтом.
- Вывод [E]: цель 7.5 за 12 месяцев **достижима, но не гарантирована**. Критичные узкие места при самостоятельной учёбе — **Writing и Speaking** (нет бесплатной авторитетной оценки). Для них в методике есть протокол калибровки (см. 02).
- Общий балл — среднее четырёх секций. Вузы/визы часто требуют минимум **по каждому** навыку: уточни в своих требованиях заранее.

## 2. Формат теста в 2026

- С **27 июня 2026** все тесты IELTS проводятся на компьютере; формат, типы заданий и оценивание не меняются [S3, S4].
- В некоторых локациях доступен вариант **Writing on Paper** (Listening/Reading — на компьютере) [S4].
- **One Skill Retake (OSR)** — пересдача одной секции вместо всего теста; при Writing on Paper пересдача — в том же формате [S4, S5]. Это страховка: подготовка к 7.5 по среднему может опираться на пересдачу самой слабой секции.
- Следствие для тренировок: с самого начала печатать Writing на клавиатуре (в т.ч. счётчик слов, без автоисправления) и тренировать Listening/Reading с экрана. Доступно ли Writing on Paper в нужной стране — проверяй при бронировании.

## 3. Логистика для РФ (важно)

- С марта 2022 регистрация на IELTS в России невозможна [S6]. Сдают за рубежом (часто Казахстан, Турция, Узбекистан, Киргизия, Армения) [S6]. Цена в Казахстане в 2026 — порядка 105 000 тенге [S7].
- **British Council признан «нежелательной организацией» в РФ (5 июня 2025)** [S8]. [E] Это значит, что работа с ресурсами BC (LearnEnglish, Road to IELTS, их соцсети/YouTube) и **публикация/репост их материалов и ссылок** может нести юридические риски. Я не юрист: проверь сам. В `data/resources.yaml` такие ресурсы помечены `ru_risk: true`. В публичный сайт их не выводить; приоритет — IDP, ielts.org, BBC, университетские и независимые ресурсы.
- Часть ресурсов может быть заблокирована в РФ: доступность проверяй сам.
- Требуемые баллы и сроки действия результата (обычно 2 года) уточняй у конкретного вуза/ведомства.

## 4. Что говорят официальные критерии (и почему «идиомы» — не серебряная пуля)

- IDP в разборе Writing Task 2 прямо советует **избегать заученных фраз, клише (напр. «double-edged sword») и пословиц**; поощряется **точная лексика и правильные коллокации**, редкие слова — когда они уместны [S9].
- Поэтому «база идиом» ≠ путь к 7.5. Рабочая единица — **коллокации и хорошо управляемые chunks** (например, `detrimental to`, `cultural diversity`), плюс разнообразная грамматика с высокой точностью. В Speaking умеренное естественное использование идиоматики полезно (проверь формулировки в официальных public band descriptors Speaking).
- Баланс: 7.5 чаще упирается в **точность** (ошибки в «простых» предложениях, формы слов, артикли, task response), чем в «заумные слова».

## 5. Бесплатные списки слов (для генерации карточек)

| Список | Размер | Заметка |
|---|---|---|
| NGSL | ~2 800 слов | базовая частотная лексика [S10] |
| Oxford 3000 / 5000 | 3 000 / 5 000 | выровнен по CEFR; есть Oxford Phrase List (650) и OPAL [S11] |
| AWL (Coxhead, 2000) | 570 семей слов, 10 сублистов | покрывает ~10% академического текста [S12] |
| NAWL (Browne et al.) | ~957–963 слова | дополняет NGSL, бесплатный [S10, S13] |
| AVL (Gardner & Davies) | 3 000 слов | бесплатно скачивается [S14] |

Лицензии списков проверяй на их сайтах перед включением в публичный репозиторий; в этой версии файлы списков **не** копируются — только ссылки и скрипт-инструкция (см. `docs/01`, этап 3).

## 6. Источники

- S1 https://support.cambridgeenglish.org/hc/en-gb/articles/202838506-Guided-learning-hours
- S2 https://ielts-testpro.com/blog/study-guide-how-long-to-prepare-for-ielts/ (вторичный, оценка)
- S3 https://ielts.idp.com/ghana/about/news-and-articles/article-updates-to-ielts-test-delivery
- S4 https://takeielts.britishcouncil.org/take-ielts/book/paper-computer/ielts-test-update
- S5 https://thepienews.com/ielts-ends-paper-based-exams-amid-shift-in-test-formats/
- S6 https://travel.yandex.ru/journal/ielts-toefl/ и https://mel.fm/novosti/3158640-ni-na-odin-ekzamen-ielts-zaregistrirovatsya-v-rossii-nelzya----ielts-students-international
- S7 https://dknews.kz/en/articles-in-english/382791-ielts-in-kazakhstan-in-2026-is-the-international-exam
- S8 https://www.aviasales.ru/psgr/article/ielts-toefl ; https://www.themoscowtimes.com/2025/06/05/moscows-british-council-ban-to-make-living-and-studying-abroad-more-difficult-for-russians-a89347/pdf
- S9 https://ielts.idp.com/prepare/article-writing-task-2-why-cant-i-get-a-band-8
- S10 https://www.newgeneralservicelist.com/new-academic-word-list
- S11 https://www.oxfordlearnersdictionaries.com/about/wordlists/
- S12 https://eapfoundation.com/download/infographics/awl.php
- S13 https://newgeneralservicelist.com/blog/academic-english-spotlight-on-the-new-academic-word-list-nawl
- S14 https://www.english-corpora.org/coca/avl.asp
