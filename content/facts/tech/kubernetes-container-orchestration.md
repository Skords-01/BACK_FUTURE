---
title: "Kubernetes — Google віддав інфраструктуру у open source"
subject: "tech"
short: "У червні 2014 року Google опублікував Kubernetes — систему оркестрації контейнерів, скопійовану з внутрішньої системи Borg. За 5 років вона стала стандартом запуску додатків у хмарі — її підтримують усі великі провайдери."
before: "Кожна компанія мала власну саморобну систему: скрипти Bash, Capistrano, Puppet, Mesos. Запуск 100 копій додатка з самонавантаженням — окрема задача на тижні."
after: "Декларативний YAML описує бажаний стан, Kubernetes сам узгоджує реальність. Підтримується усіма головними хмарами; CNCF став центром тяжіння інфраструктури."
yearOfEvent: 2014
relevantForEras: [1, 2, 3, 4]
region: "world"
impact: "medium"
sources:
  - title: "Kubernetes documentation: Concepts overview"
    url: "https://kubernetes.io/docs/concepts/overview/"
  - title: "Google Research: Borg, Omega and Kubernetes (2016)"
    url: "https://research.google/pubs/borg-omega-and-kubernetes/"
  - title: "CNCF: Kubernetes case studies"
    url: "https://www.cncf.io/case-studies/"
tags: ["kubernetes", "DevOps", "контейнери", "open-source"]
draft: false
---

У 2010-х усі більш-менш великі вебсервіси робили те саме, але по-різному: упаковували додатки у контейнери Linux (зазвичай Docker, з 2013-го), а потім самі писали інструменти для запуску, рестарту, оновлення цих контейнерів на сотнях серверів. Google усе це робив із 2003-го через внутрішню систему **Borg**, але назовні нічого не публікував.

У червні 2014-го Google зробив несподіваний крок: відкрив open-source-наступника Borg під назвою **Kubernetes** (грецьке «керманич», звідси традиційне скорочення k8s). Перший комерційний реліз 1.0 вийшов у липні 2015-го, разом із створенням [Cloud Native Computing Foundation](https://www.cncf.io/case-studies/) при Linux Foundation — Google одразу передав проєкт у нейтральні руки.

Архітектурна ідея проста: ти описуєш у YAML бажаний стан (наприклад, «мій сервіс має 5 реплік, кожна з 1 ГБ пам'яті, доступних на порту 80»), а Kubernetes постійно узгоджує реальність із цим описом — піднімає, перезапускає, переміщує контейнери. Завдання інженера зміщується з «налаштувати конкретні сервери» на «правильно описати, що має бути».

Сьогодні Kubernetes керує інфраструктурою Spotify, Pinterest, Adidas, BlaBlaCar, банків і урядів. AWS, Azure, Google Cloud, Oracle — усі мають керовані Kubernetes-сервіси. Конкуренти на кшталт Mesos і Docker Swarm програли з різницею за 2017-2019. Знання Kubernetes стало базовою вимогою для DevOps-вакансій.

> «Borg був нашим секретом. Kubernetes — наше зізнання у тому, як робиться сучасна інфраструктура», — Брайан Грант, один з авторів проєкту.
