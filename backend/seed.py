"""
Seed script for VK Mini App «ЛАМПА 2026»
Fills database with 12 tasks, 5 merchandise items, demo leaderboard users, and test QR codes.
"""

from app.database import Base, SessionLocal, engine
from app.models import ShopItem, Task


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("🌱 Seeding database for Лампа 2026...")

    # 1. Seed Tasks (12 official tasks from ачивки.docx and prompt.md)
    tasks_data = [
        {
            "order_num": 1,
            "title": "«На связи»",
            "description": "Подпишись на группы Профкома КГУ им. К.Э. Циолковского и Лагеря студенческого актива «Лампа» в ВК, не забудь прислать скриншоты для подтверждения",
            "points": 10,
            "frequency": "ONCE",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 2,
            "title": "«Я в тренде»",
            "description": "Установи брендированную аватарку в ВК и пришли фото-подтверждение",
            "points": 30,
            "frequency": "ONCE",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 3,
            "title": "«Зафиксировано»",
            "description": "Выложи историю в ВК о лагере (1 день = 1 история)",
            "points": 20,
            "frequency": "DAILY",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 4,
            "title": "«Сыщик»",
            "description": "Найди QR-код от организаторов на территории лагеря (1 QR-код = 1 человек)",
            "points": 10,
            "frequency": "DAILY",
            "task_type": "QR",
            "daily_global_limit": None,
        },
        {
            "order_num": 5,
            "title": "«Счастливчик дня»",
            "description": "Пиши комментарии и ставь лайки в группах ВК (Профком и Лампа), случайным образом выберем 5 счастливчиков",
            "points": 50,
            "frequency": "DAILY",
            "task_type": "MANUAL",
            "daily_global_limit": 5,
        },
        {
            "order_num": 6,
            "title": "«Самый умный»",
            "description": "Будь активным на лекции и получи ачивку от лектора",
            "points": 50,
            "frequency": "DAILY",
            "task_type": "MANUAL",
            "daily_global_limit": None,
        },
        {
            "order_num": 7,
            "title": "«Мемный чел»",
            "description": "Сделай мем связанный с лагерем и пришли его в сообщения сообщества",
            "points": 30,
            "frequency": "DAILY",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 8,
            "title": "«GYM-бро»",
            "description": "Приходи на зарядку первым и получи доп. балл (Получают первые 5 человек)",
            "points": 10,
            "frequency": "DAILY",
            "task_type": "MANUAL",
            "daily_global_limit": 5,
        },
        {
            "order_num": 9,
            "title": "«Живые легенды»",
            "description": "Победи на вечернем мероприятии и получи личные баллы за свой результат",
            "points": 30,
            "frequency": "DAILY",
            "task_type": "MANUAL",
            "daily_global_limit": None,
        },
        {
            "order_num": 10,
            "title": "«Расскажи всем»",
            "description": "Выложи на своей странице пост о лагере с хештегом #Лампа_2026",
            "points": 50,
            "frequency": "ONCE",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 11,
            "title": "«МВП»",
            "description": "Сними вертикальное трендовое видео, связанное с лагерем и пришли в сообщения сообщества (1 день = 1 клип)",
            "points": 80,
            "frequency": "DAILY",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
        {
            "order_num": 12,
            "title": "«Фото со звездой»",
            "description": "Сделай фото с организаторами и пришли в сообщения сообщества",
            "points": 20,
            "frequency": "ONCE",
            "task_type": "SCREENSHOT",
            "daily_global_limit": None,
        },
    ]

    for item in tasks_data:
        existing = db.query(Task).filter(Task.title == item["title"]).first()
        if not existing:
            t = Task(**item)
            db.add(t)
        elif item["title"] == "«Живые легенды»" and "команды" in existing.description:
            existing.description = item["description"]
    db.commit()
    print(f"✅ Tasks seeded: {len(tasks_data)}")

    # 2. Seed Shop Items (from ачивки.docx and prompt.md)
    shop_data = [
        {
            "title": "СЮРПРИЗ ОТ ОРГАНИЗАТОРОВ",
            "price": 700,
            "stock": 1,
            "max_per_user": None,
        },
        {
            "title": "ШОППЕР",
            "price": 600,
            "stock": 10,
            "max_per_user": None,
        },
        {
            "title": "СТИКЕРЫ",
            "price": 500,
            "stock": 10,
            "max_per_user": None,
        },
        {
            "title": "ЗАПАС ЕДЫ",
            "price": 400,
            "stock": 30,
            "max_per_user": None,
        },
        {
            "title": "VIP-БЕЙДЖ",
            "price": 300,
            "stock": 50,
            "max_per_user": 1, # 1 person = 1 badge
        },
    ]

    for item in shop_data:
        existing = db.query(ShopItem).filter(ShopItem.title == item["title"]).first()
        if not existing:
            s = ShopItem(**item)
            db.add(s)
    db.commit()
    print(f"✅ Shop items seeded: {len(shop_data)}")

    db.close()
    print("🚀 All seed data successfully loaded!")

if __name__ == "__main__":
    run_seed()
