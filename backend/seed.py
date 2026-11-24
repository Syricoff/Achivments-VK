"""
Seed script for VK Mini App «ЛАМПА 2026»
Fills database with 12 tasks, 5 merchandise items, demo leaderboard users, and test QR codes.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import User, Task, ShopItem, QRCode, Submission

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
            "description": "Победи на вечернем мероприятии и все члены вашей команды получат баллы",
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

    # 3. Seed Demo Users & Leaderboard
    demo_users = [
        {"vk_id": 10001, "first_name": "Алексей", "last_name": "Иванов", "rating_points": 900, "spendable_points": 900, "role": "ADMIN", "team_name": "Отряд 1", "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"},
        {"vk_id": 10002, "first_name": "Екатерина", "last_name": "Смирнова", "rating_points": 1000, "spendable_points": 1000, "role": "USER", "team_name": "Отряд 2", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"},
        {"vk_id": 10003, "first_name": "Дмитрий", "last_name": "Соколов", "rating_points": 800, "spendable_points": 800, "role": "USER", "team_name": "Отряд 1", "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80"},
        {"vk_id": 10004, "first_name": "Анна", "last_name": "Кузнецова", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 3", "avatar_url": None},
        {"vk_id": 10005, "first_name": "Михаил", "last_name": "Попов", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 2", "avatar_url": None},
        {"vk_id": 10006, "first_name": "Полина", "last_name": "Васильева", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 1", "avatar_url": None},
        {"vk_id": 10007, "first_name": "Иван", "last_name": "Петров", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 4", "avatar_url": None},
        {"vk_id": 10008, "first_name": "София", "last_name": "Новикова", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 3", "avatar_url": None},
        {"vk_id": 10009, "first_name": "Артем", "last_name": "Федоров", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 4", "avatar_url": None},
        {"vk_id": 10010, "first_name": "Мария", "last_name": "Морозова", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 2", "avatar_url": None},
        {"vk_id": 10011, "first_name": "Никита", "last_name": "Волков", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 1", "avatar_url": None},
        {"vk_id": 10012, "first_name": "Дарья", "last_name": "Алексеева", "rating_points": 150, "spendable_points": 150, "role": "USER", "team_name": "Отряд 3", "avatar_url": None},
    ]

    for u in demo_users:
        existing = db.query(User).filter(User.vk_id == u["vk_id"]).first()
        if not existing:
            user = User(**u)
            db.add(user)
    db.commit()
    print(f"✅ Demo users seeded: {len(demo_users)}")

    # 4. Seed Test QR Codes for Detective task
    qr_data = [
        {"code_hash": "LAMPA-QR-CAMP-001", "points": 10},
        {"code_hash": "LAMPA-QR-CAMP-002", "points": 10},
        {"code_hash": "LAMPA-QR-CAMP-003", "points": 10},
        {"code_hash": "LAMPA-QR-CAMP-004", "points": 10},
        {"code_hash": "LAMPA-QR-CAMP-005", "points": 10},
    ]
    for q in qr_data:
        if not db.query(QRCode).filter(QRCode.code_hash == q["code_hash"]).first():
            db.add(QRCode(**q))
    db.commit()
    print(f"✅ QR codes seeded: {len(qr_data)}")

    # 5. Seed a pending submission for admin moderation demonstration
    admin_user = db.query(User).filter(User.role == "ADMIN").first()
    sub_user = db.query(User).filter(User.vk_id == 10004).first()
    task_mem = db.query(Task).filter(Task.title == "«Мемный чел»").first()
    if sub_user and task_mem:
        existing_sub = db.query(Submission).filter(Submission.user_id == sub_user.id, Submission.task_id == task_mem.id).first()
        if not existing_sub:
            sub = Submission(
                user_id=sub_user.id,
                task_id=task_mem.id,
                proof_image_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
                comment="Вот мой смешной мем про лекции в лагере!",
                status="PENDING"
            )
            db.add(sub)
            db.commit()
            print("✅ Demo submission for moderation seeded")

    db.close()
    print("🚀 All seed data successfully loaded!")

if __name__ == "__main__":
    run_seed()
