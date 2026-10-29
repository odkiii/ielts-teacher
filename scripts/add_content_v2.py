"""Одноразовое добавление контента (reading r4–r5, writing, speaking). Текст оригинальный."""
import json
P="app/data/"
# ---------- Reading ----------
R=json.load(open(P+"reading.json",encoding="utf-8"))
if not any(t["id"]=="r4" for t in R["tests"]):
    opts=lambda L:[[x,x] for x in L]
    R["tests"].append({"id":"r4","title":"Bringing back the beaver","topic":"Environment","minutes":20,"paras":[
{"k":"A","t":"Beavers were hunted to extinction in Britain about four centuries ago, mainly for their fur and scent glands. In recent years, however, small groups have been released in carefully fenced areas, and wild populations have also appeared elsewhere in the country. Their return has divided opinion."},
{"k":"B","t":"Beavers build dams from branches and mud. These slow the flow of rivers and create ponds and areas of wet ground. Researchers monitoring one site in the south-west found that a single family of beavers lowered the peak flow of water downstream during storms by about a third."},
{"k":"C","t":"The benefits for wildlife are clear. Ponds attract amphibians, insects and the birds that feed on them, while dead wood and standing water create habitats that are rare in intensively farmed land. Surveys at the same site recorded more species of dragonfly after the beavers arrived than before."},
{"k":"D","t":"Not everyone welcomes the animals. Farmers whose fields lie beside rivers report that dams can flood crops and block drainage channels, and some beavers gnaw through trees planted by landowners. Compensation schemes exist in some countries but not in all."},
{"k":"E","t":"Managers have developed practical answers. Flow devices, which are pipes passed through a dam, keep the water at a safe level, and trees can be protected with wire mesh. Where a family causes serious problems it can be moved, although relocation is expensive and does not always work, since animals may travel a long way from the release point."},
{"k":"F","t":"Public attitudes matter too. A survey of residents living near release sites found that most supported the project, while support was lower among people who lived further away and had no direct experience of the animals. Researchers suggest that seeing the benefits first-hand persuades people more than being told about them."}],
"groups":[
{"type":"mcq","title":"Questions 1–4","instr":"Choose the correct letter, A, B, C or D.","items":[
{"n":1,"q":"According to paragraph A, beavers disappeared from Britain because","opts":["A  the climate changed.","B  people hunted them.","C  a disease spread.","D  forests were cut down."],"a":"B","why":"A: 'hunted to extinction… for their fur and scent glands'."},
{"n":2,"q":"At the research site in the south-west, the beavers' dams","opts":["A  stopped flooding completely.","B  lowered the highest water flow downstream in storms.","C  dried out the river in summer.","D  made the water run faster."],"a":"B","why":"B: 'lowered the peak flow… by about a third'."},
{"n":3,"q":"What does paragraph D say about compensation for farmers?","opts":["A  It is paid in every country.","B  It exists in some countries only.","C  Farmers have refused it.","D  It covers lost trees only."],"a":"B","why":"D: 'in some countries but not in all'."},
{"n":4,"q":"What does the writer say about moving beavers to another place?","opts":["A  It is cheap and reliable.","B  It is the first thing managers try.","C  It can be costly and may fail.","D  It is forbidden by law."],"a":"C","why":"E: 'expensive and does not always work'."}]},
{"type":"tfng","title":"Questions 5–9","instr":"Do the following statements agree with the information in the text? Choose TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if there is no information.","items":[
{"n":5,"q":"Some beavers have been released in fenced areas.","a":"T","why":"A: 'released in carefully fenced areas'."},
{"n":6,"q":"The south-west site has been monitored for more than ten years.","a":"NG","why":"The length of monitoring is not mentioned."},
{"n":7,"q":"More dragonfly species were recorded after the beavers arrived.","a":"T","why":"C."},
{"n":8,"q":"Habitats with standing water are common on intensively farmed land.","a":"F","why":"C: 'rare in intensively farmed land'."},
{"n":9,"q":"People living far from release sites support the project more than people living nearby.","a":"F","why":"F: support was lower among those further away."}]},
{"type":"sc","title":"Questions 10–13","instr":"Complete the sentences. Write NO MORE THAN TWO WORDS from the text for each answer.","items":[
{"n":10,"q":"Beavers were originally hunted for their fur and _____.","a":["scent glands"],"why":"A."},
{"n":11,"q":"Pipes passed through a dam are known as _____ devices.","a":["flow"],"why":"E."},
{"n":12,"q":"Landowners can protect young trees with wire _____.","a":["mesh"],"why":"E."},
{"n":13,"q":"Researchers say seeing the benefits _____ persuades people more than being told.","a":["first-hand","firsthand","first hand"],"why":"F."}]}]})
    R["tests"].append({"id":"r5","title":"Farming in towers","topic":"Technology and food","minutes":20,"paras":[
{"k":"A","t":"Vertical farms grow crops in stacked layers inside buildings, using LED lights and nutrient-rich water instead of soil. Because air, temperature and light are controlled, harvests do not depend on the weather, and leafy vegetables can be ready in as little as two weeks."},
{"k":"B","t":"Supporters point first to water. Closed systems recycle it, so they use only a fraction of the amount needed to irrigate a field. Because such farms can be built in or near cities, food also travels a short distance, which cuts transport emissions and shortens the time between harvest and sale."},
{"k":"C","t":"The difficulty is cost. Lighting and climate control use large amounts of electricity, and several well-funded companies have closed in recent years because their energy bills were higher than their sales. Analysts say that vertical farming makes financial sense only for high-value crops such as herbs, salad leaves and strawberries; staple foods such as wheat and rice need too much space and light."},
{"k":"D","t":"The source of the electricity matters a great deal. Where power comes from solar or wind, the environmental case is stronger; where it comes from coal, most of the benefit disappears. A few farms have been built next to factories so that they can use waste heat from industrial processes to reduce their costs."},
{"k":"E","t":"Most experts do not expect vertical farms to replace conventional agriculture. They see them instead as a complement, supplying fresh produce to cities and to places with harsh climates, such as deserts and polar regions, where growing crops in fields is impossible."}],
"groups":[
{"type":"mi","title":"Questions 1–4","instr":"Which paragraph contains the following information? Write the correct letter, A–E. You may use any letter more than once.","options":opts("ABCDE"),"items":[
{"n":1,"q":"a reason why some businesses have failed","a":"C","why":"C: bills higher than sales."},
{"n":2,"q":"a way of reducing costs by using heat from another source","a":"D","why":"D: waste heat from factories."},
{"n":3,"q":"a description of the conditions that let crops grow whatever the weather","a":"A","why":"A: controlled air, temperature and light."},
{"n":4,"q":"a reference to places where field farming cannot work","a":"E","why":"E: deserts and polar regions."}]},
{"type":"tfng","title":"Questions 5–9","instr":"Do the following statements agree with the information in the text? Choose TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if there is no information.","items":[
{"n":5,"q":"Vertical farms grow plants in soil enriched with nutrients.","a":"F","why":"A: 'instead of soil'."},
{"n":6,"q":"Food from a vertical farm can reach shoppers sooner after harvest.","a":"T","why":"B: shortens the time between harvest and sale."},
{"n":7,"q":"Every vertical farming company has been profitable.","a":"F","why":"C: several have closed."},
{"n":8,"q":"Strawberries are given as an example of a high-value crop.","a":"T","why":"C."},
{"n":9,"q":"The text names the company with the largest vertical farm.","a":"NG","why":"No company is named."}]},
{"type":"sc","title":"Questions 10–13","instr":"Complete the sentences. Write NO MORE THAN TWO WORDS from the text for each answer.","items":[
{"n":10,"q":"Leafy vegetables can be ready in as little as _____.","a":["two weeks"],"why":"A."},
{"n":11,"q":"Closed systems recycle _____.","a":["water"],"why":"B."},
{"n":12,"q":"The environmental case is stronger when electricity comes from wind or _____ power.","a":["solar"],"why":"D."},
{"n":13,"q":"Some farms use _____ from industrial processes to cut costs.","a":["waste heat"],"why":"D."}]}]})
    json.dump(R,open(P+"reading.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
# ---------- Writing ----------
W=json.load(open(P+"writing.json",encoding="utf-8"))
if not any(t["id"]=="w21" for t in W["task2"]):
    T=[("op","Environment","Some people believe that individuals can do little to protect the environment and that only governments and large companies can make a real difference. To what extent do you agree or disagree?",["Выбор потребителей влияет на рынок","Масштаб: законы и корпорации","Вывод: роли дополняют друг друга"]),
("db","Work","Some people prefer to work for a large company, while others prefer a small business. Discuss both views and give your own opinion.",["Большая: стабильность, карьера","Малая: гибкость, ответственность","Своё мнение"]),
("ad","Education","More and more students now study at universities abroad. Do the advantages of this outweigh the disadvantages?",["Языки, опыт, сети контактов","Стоимость, тоска по дому","Взвесь и выбери"]),
("ps","Urban life","Many city centres suffer from noise and air pollution. What are the causes, and what can be done to improve the situation?",["Транспорт, строительство","Зоны с низкими выбросами, зелень","Общественный транспорт"]),
("tp","Technology","Many people now spend several hours a day on social media. Why is this? Is it a positive or negative development?",["Общение, развлечение, привычка","Тревожность vs связь с людьми","Баланс"]),
("op","Health","Governments should tax unhealthy food, such as sugary drinks, to improve public health. To what extent do you agree or disagree?",["Налог меняет поведение","Бьёт по бедным","Альтернативы: образование, маркировка"]),
("db","Society","Some people think the best way to reduce crime is to give longer prison sentences. Others believe there are better alternatives. Discuss both views and give your own opinion.",["Сдерживание, изоляция","Образование, работа, профилактика","Своё мнение"]),
("ad","Work","In some countries, more people work from home than before. Do the advantages of this development outweigh the disadvantages?",["Время, гибкость","Изоляция, границы работа/дом","Вывод"]),
("tp","Media","News is now available around the clock on the internet and on television. What are the effects on society? Is this a positive or negative development?",["Информированность vs перегрузка","Фейки, скорость","Вывод"]),
("op","Culture","Museums and historical sites should be free for everyone, paid for by taxes. To what extent do you agree or disagree?",["Доступ к культуре","Деньги на содержание","Компромисс: льготы"])]
    for i,(ty,tp,q,ideas) in enumerate(T,21): W["task2"].append({"id":f"w{i}","type":ty,"topic":tp,"q":q,"ideas":ideas})
    W["task1"]+=[
{"id":"a9","kind":"bar","title":"Percentage of adults who use online banking, by age group, 2012 and 2022","cats":["18–29","30–44","45–59","60+"],"series":[{"name":"2012","v":[48,41,27,9]},{"name":"2022","v":[93,89,76,45]}],"hint":"рост везде; самый большой скачок у 60+"},
{"id":"a10","kind":"line","title":"Average daily steps in three cities, 2015–2023 (thousands)","x":["2015","2017","2019","2021","2023"],"series":[{"name":"Alton","v":[6.2,6.5,6.9,7.4,8.1]},{"name":"Brix","v":[7.8,7.6,7.1,6.9,7.0]},{"name":"Cardon","v":[5.1,5.9,6.4,6.6,6.5]}],"hint":"три разных тренда"},
{"id":"a11","kind":"table","title":"Hours spent on selected activities by students in four countries (per week)","head":["Country","Study","Part-time work","Sport","Sleep"],"rows":[["Country A",32,6,5,52],["Country B",24,12,4,56],["Country C",38,3,7,49],["Country D",28,9,3,54]],"hint":"сравни по каждому столбцу, выдели экстремумы"}]
    W["gt"]+=[
{"id":"g7","tone":"Semi-formal","q":"A neighbour is going on holiday and has asked you to look after their pet. Write a letter to your neighbour. In your letter: say whether you can help; explain what you will need to know; suggest when to meet before they leave."},
{"id":"g8","tone":"Formal","q":"You bought an item online but it arrived damaged. Write a letter to the company. In your letter: describe the problem; explain what you have already done; say what you want the company to do."},
{"id":"g9","tone":"Informal","q":"A friend has just moved to your city and is looking for a place to study English. Write a letter to your friend. In your letter: suggest a place; explain why it is good; offer to go there together."}]
    json.dump(W,open(P+"writing.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
# ---------- Speaking topics ----------
C=json.load(open(P+"content.json",encoding="utf-8"))
more=["Clothes","Holidays and festivals","Birthdays","Colours","Photography","Handwriting","Museums","Public transport","Languages","Cooking at home","Pets","The internet","Mobile phones","Small talk","Noise","Parks and nature","Bicycles","Weekends","TV and films","Gifts"]
C["speakingTopics"]+= [m for m in more if m not in C["speakingTopics"]]
json.dump(C,open(P+"content.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("ok",len(R["tests"]),len(W["task2"]),len(W["task1"]),len(W["gt"]),len(C["speakingTopics"]))
