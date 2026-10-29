# 04. Откуда контент (карточки, Reading, Writing)

**Честно о статусе проверки.** Это учебный контент проекта, а не копия чужих материалов.

## Карточки (`data/deck/*.txt` → `app/data/deck.json`, ~530 штук)
- **Отбор слов:** опора на открытые академические и частотные списки — Academic Word List (A. Coxhead, Victoria University of Wellington), общеупотребительные коллокации для Writing Task 2/Task 1/Speaking. Сайт AWL автор проекта при сборке не смог открыть для сверки, поэтому слова подобраны по памяти и **не сверены построчно** со списками. Добавь сверку в PR, если хочешь.
- **Переводы и примеры** написаны для проекта (оригинальный текст, не из словарей). Перед заучиванием сложных слов сверяй значение и коллокации в [Cambridge Dictionary](https://dictionary.cambridge.org/) или [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/).
- Формат строки: `term|перевод|пример с [[формой слова]]|pos|домен`. Сборка: `npm run data`.

## Reading (`app/data/reading.json`)
5 учебных текстов (Academic-формат, 66 вопросов: matching headings, matching information, True/False/Not Given, completion). Тексты оригинальные; не из Cambridge/IDP/British Council. Типы заданий соответствуют официальному описанию формата (см. [IDP: Reading question types](https://ielts.idp.com/prepare/article-ielts-reading-question-types)). Пересчёт в band — приблизительный.

## Writing (`app/data/writing.json`)
20 вопросов Task 2, 8 заданий Task 1 (данные вымышленные), 6 писем GT. Темы отражают повторяющиеся кластеры 2024–2026 из отчётов кандидатов (образование, технологии и работа, окружающая среда, здоровье, город и транспорт, культура, преступность, СМИ). Настоящие вопросы IELTS не публикуются, поэтому это не оригинальные экзаменационные задания.
