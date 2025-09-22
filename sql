-- ユーザーテーブル
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    current_hp INTEGER,
    max_hp INTEGER,
    attack INTEGER,
    defense INTEGER
);

-- アイテムテーブル（武器、防具、ペット）
CREATE TABLE item (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'weapon', 'armor', 'pet'
    rarity TEXT NOT NULL, -- 'N', 'R', 'SR', 'SSR'
    attack_bonus INTEGER,
    defense_bonus INTEGER,
    hp_bonus INTEGER,
    max_level INTEGER,
    image_url TEXT
);

-- ユーザーが所持するアイテム
CREATE TABLE user_item (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    item_id INTEGER,
    level INTEGER DEFAULT 1,
    is_equipped BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES user(id),
    FOREIGN KEY(item_id) REFERENCES item(id)
);

-- ガチャの履歴と学習記録
CREATE TABLE study_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    date TEXT,  -- 'YYYY-MM-DD'
    study_content TEXT,
    gacha_count INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES user(id)
);

-- 敵テーブル
CREATE TABLE enemy (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER,
    attack INTEGER,
    is_boss BOOLEAN DEFAULT 0,
    image_url TEXT
);
