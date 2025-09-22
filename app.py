# app.py
from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3
import random
from datetime import date

app = Flask(__name__)
app.secret_key = 'your_secret_key'

DATABASE = 'rpg_study.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# データベース初期化
def init_db():
    with app.app_context():
        conn = get_db_connection()
        c = conn.cursor()
        # テーブル作成
        c.execute("""
            CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                current_hp INTEGER,
                max_hp INTEGER,
                attack INTEGER,
                defense INTEGER
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS item (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                rarity TEXT NOT NULL,
                attack_bonus INTEGER,
                defense_bonus INTEGER,
                hp_bonus INTEGER,
                max_level INTEGER,
                image_url TEXT
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS user_item (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                item_id INTEGER,
                level INTEGER DEFAULT 1,
                is_equipped BOOLEAN DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES user(id),
                FOREIGN KEY(item_id) REFERENCES item(id)
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS study_log (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                date TEXT,
                study_content TEXT,
                gacha_count INTEGER DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS enemy (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                hp INTEGER,
                attack INTEGER,
                is_boss BOOLEAN DEFAULT 0,
                image_url TEXT
            )
        """)
        
        # サンプルデータ投入 (初回起動時のみ)
        # ユーザーデータ
        c.execute("SELECT COUNT(*) FROM user")
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO user (name, current_hp, max_hp, attack, defense) VALUES (?, ?, ?, ?, ?)",
                      ('勇者', 100, 100, 10, 5))
            
        # アイテムデータ
        c.execute("SELECT COUNT(*) FROM item")
        if c.fetchone()[0] == 0:
            items_data = [
                ('木の剣', 'weapon', 'N', 5, 0, 0, 5, 'https://example.com/tree_sword.png'),
                ('石の盾', 'armor', 'N', 0, 3, 0, 5, 'https://example.com/stone_shield.png'),
                ('スライム', 'pet', 'N', 2, 2, 5, 5, 'https://example.com/slime.png'),
                ('鉄の剣', 'weapon', 'R', 10, 0, 0, 10, 'https://example.com/iron_sword.png'),
                ('革の鎧', 'armor', 'R', 0, 7, 0, 10, 'https://example.com/leather_armor.png'),
                ('炎の剣', 'weapon', 'SR', 25, 0, 0, 25, 'https://example.com/flame_sword.png'),
                ('ドラゴンの盾', 'armor', 'SSR', 0, 30, 0, 50, 'https://example.com/dragon_shield.png')
            ]
            c.executemany("INSERT INTO item (name, type, rarity, attack_bonus, defense_bonus, hp_bonus, max_level, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", items_data)
            
        # 敵データ
        c.execute("SELECT COUNT(*) FROM enemy")
        if c.fetchone()[0] == 0:
            enemies_data = [
                ('ゴブリン', 20, 5, False, 'https://example.com/goblin.png'),
                ('オーク', 50, 15, False, 'https://example.com/orc.png'),
                ('スケルトン', 30, 8, False, 'https://example.com/skeleton.png'),
                ('ドラゴン', 500, 50, True, 'https://example.com/dragon.png')
            ]
            c.executemany("INSERT INTO enemy (name, hp, attack, is_boss, image_url) VALUES (?, ?, ?, ?, ?)", enemies_data)

        conn.commit()
        conn.close()

# ガチャ排出ロジック
def roll_gacha(gacha_type):
    # 排出率設定
    rarities = ['SSR', 'SR', 'R', 'N']
    weights = {'SSR': 1, 'SR': 5, 'R': 20, 'N': 74}
    
    conn = get_db_connection()
    items = conn.execute("SELECT * FROM item WHERE type=?", (gacha_type,)).fetchall()
    
    # 確率に応じたアイテム選択
    pool = []
    for item in items:
        rarity = item['rarity']
        if rarity in weights:
            pool.extend([item] * weights[rarity])
    
    if not pool:
        return None
        
    return random.choice(pool)

@app.route('/')
def index():
    user_id = 1 # ユーザーIDはセッション管理を想定
    conn = get_db_connection()
    today = str(date.today())
    
    log = conn.execute("SELECT * FROM study_log WHERE user_id=? AND date=?", (user_id, today)).fetchone()
    if not log:
        # 今日のログがなければ作成
        conn.execute("INSERT INTO study_log (user_id, date, gacha_count) VALUES (?, ?, ?)", (user_id, today, 0))
        conn.commit()
        log = conn.execute("SELECT * FROM study_log WHERE user_id=? AND date=?", (user_id, today)).fetchone()
    
    gacha_count = log['gacha_count']
    remaining_gacha = 5 - gacha_count
    
    return render_template('index.html', remaining_gacha=remaining_gacha)

@app.route('/gacha', methods=['POST'])
def gacha():
    user_id = 1
    gacha_type = request.form.get('gacha_type') # 'weapon' or 'pet'
    study_content = request.form.get('study_content')
    
    conn = get_db_connection()
    today = str(date.today())
    log = conn.execute("SELECT * FROM study_log WHERE user_id=? AND date=?", (user_id, today)).fetchone()
    
    if not log or log['gacha_count'] >= 5:
        # ガチャ回数上限に達しているか、ログがない場合はエラー
        return redirect(url_for('index'))
    
    # ログに勉強内容を記録し、ガチャ回数を増やす
    conn.execute("UPDATE study_log SET study_content=?, gacha_count=? WHERE user_id=? AND date=?",
                 (study_content, log['gacha_count'] + 1, user_id, today))
    conn.commit()
    
    # ガチャ実行
    pulled_item = roll_gacha(gacha_type)
    
    if pulled_item:
        # ユーザーのアイテムをチェック
        existing_item = conn.execute("SELECT * FROM user_item WHERE user_id=? AND item_id=?", 
                                     (user_id, pulled_item['id'])).fetchone()
        
        if existing_item:
            # 重複入手の場合、レベルアップ
            new_level = existing_item['level'] + 1
            if new_level <= pulled_item['max_level']:
                conn.execute("UPDATE user_item SET level=? WHERE id=?", (new_level, existing_item['id']))
                message = f"{pulled_item['name']}を重複して入手しました！レベルが{new_level}に上がりました！"
            else:
                message = f"{pulled_item['name']}を重複して入手しましたが、すでに最大レベルです。"
        else:
            # 新規入手
            conn.execute("INSERT INTO user_item (user_id, item_id) VALUES (?, ?)",
                         (user_id, pulled_item['id']))
            message = f"{pulled_item['name']}を新しく手に入れました！"
        
        conn.commit()
        
    else:
        message = "ガチャは失敗しました..." # 例外処理
    
    return render_template('gacha_result.html', pulled_item=pulled_item, message=message)

@app.route('/inventory')
def inventory():
    user_id = 1
    conn = get_db_connection()
    
    # ユーザーと装備アイテムの情報を取得
    user = conn.execute("SELECT * FROM user WHERE id=?", (user_id,)).fetchone()
    equipped_items = conn.execute("""
        SELECT ui.*, i.name, i.type, i.image_url, i.attack_bonus, i.defense_bonus, i.hp_bonus, i.max_level
        FROM user_item ui
        JOIN item i ON ui.item_id = i.id
        WHERE ui.user_id = ? AND ui.is_equipped = 1
    """, (user_id,)).fetchall()
    
    # 未装備のアイテムも取得
    unequipped_items = conn.execute("""
        SELECT ui.*, i.name, i.type, i.image_url, i.attack_bonus, i.defense_bonus, i.hp_bonus, i.max_level
        FROM user_item ui
        JOIN item i ON ui.item_id = i.id
        WHERE ui.user_id = ? AND ui.is_equipped = 0
    """, (user_id,)).fetchall()
    
    return render_template('inventory.html', user=user, equipped_items=equipped_items, unequipped_items=unequipped_items)

@app.route('/equip/<int:user_item_id>', methods=['POST'])
def equip_item(user_item_id):
    user_id = 1
    conn = get_db_connection()
    
    item_to_equip = conn.execute("""
        SELECT ui.*, i.type
        FROM user_item ui
        JOIN item i ON ui.item_id = i.id
        WHERE ui.id = ? AND ui.user_id = ?
    """, (user_item_id, user_id)).fetchone()
    
    if item_to_equip:
        # 同じタイプの既存の装備を解除
        conn.execute("UPDATE user_item SET is_equipped = 0 WHERE user_id = ? AND item_id IN (SELECT item_id FROM item WHERE type = ?)",
                     (user_id, item_to_equip['type']))
        
        # 新しいアイテムを装備
        conn.execute("UPDATE user_item SET is_equipped = 1 WHERE id = ?", (user_item_id,))
        conn.commit()
        
    return redirect(url_for('inventory'))
    
@app.route('/enemy')
def show_enemies():
    # 敵の出現ロジック
    stage = session.get('stage', 1)
    if not session.get('enemies'):
        conn = get_db_connection()
        # サンプルとして、ステージ1はゴブリン、オーク、スケルトン
        enemies = conn.execute("SELECT * FROM enemy WHERE name IN ('ゴブリン', 'オーク', 'スケルトン') ORDER BY RANDOM() LIMIT 3").fetchall()
        session['enemies'] = [dict(e) for e in enemies] # dictに変換してセッションに保存
    
    user_id = 1
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM user WHERE id=?", (user_id,)).fetchone()
    
    return render_template('enemy.html', user=user, enemies=session['enemies'])

@app.route('/attack/<int:enemy_id>')
def attack(enemy_id):
    user_id = 1
    conn = get_db_connection()
    
    user = conn.execute("SELECT * FROM user WHERE id=?", (user_id,)).fetchone()
    enemies = session.get('enemies', [])
    
    if user['current_hp'] <= 0:
        return "ゲームオーバー..." # 死亡時の処理
        
    target_enemy = next((e for e in enemies if e['id'] == enemy_id), None)
    
    if target_enemy:
        # 自分の攻撃
        damage_to_enemy = user['attack']
        target_enemy['hp'] -= damage_to_enemy
        
        # 敵からの反撃
        if target_enemy['hp'] > 0:
            damage_to_user = max(1, target_enemy['attack'] - user['defense'])
            new_hp = user['current_hp'] - damage_to_user
            conn.execute("UPDATE user SET current_hp=? WHERE id=?", (new_hp, user_id))
            conn.commit()
            
    # 全ての敵を倒したかチェック
    if all(e['hp'] <= 0 for e in enemies):
        session['stage'] = session.get('stage', 1) + 1
        session.pop('enemies', None) # 敵をリセット
        message = "全ての敵を倒しました！次のステージへ！"
    
    session['enemies'] = enemies
    return redirect(url_for('show_enemies'))


@app.route('/calendar')
def show_calendar():
    user_id = 1
    conn = get_db_connection()
    logs = conn.execute("SELECT * FROM study_log WHERE user_id=? ORDER BY date DESC", (user_id,)).fetchall()
    
    return render_template('calendar.html', logs=logs)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
