# カード・コロシアム / CARD COLISEUM

1対1のターン制デッキ構築カードバトル。マナを管理しながら手札を切り、思考する敵AIの意図を読み、6人の闘士を連戦で突破する。

- **エンジン**: TypeScript の純粋関数 + 決定論的RNG（React/DOM非依存）
- **UI**: React 18 + Vite。演出はCSSアニメーションとWeb Animations相当の合成のみ
- **アセット**: 外部画像・音声ファイルなし（効果音はWebAudioでリアルタイム合成）

## 起動

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド
npm run typecheck
```

## 遊び方

- 毎ターンマナが3に回復し、手札を5枚引く。カードをクリック（または1–9キー）でプレイ。
- ブロックは自分のターン開始時に消える。敵の意図を見て先に張るのが基本。
- 敵の頭上に次の行動（攻撃値・防御値・意図）が表示される。ホバーするとAIの思考理由まで読める。
- 罠カードは設置型。敵が攻撃した瞬間に発動する（最大3枚）。
- 勝利後、3枚から1枚を選んでデッキに追加。見送るとHPが回復する。
- 6戦目はコロシアムの王アステリオン。HPが50%を切ると激昂する。

## ファイル構成

```
src/
  game/                 ゲームエンジン（UI非依存）
    types.ts            ドメイン型。Effect / CardDef / BattleState / RunState
    rng.ts              シード付き乱数（mulberry32）
    constants.ts        バランス定数（HP・マナ・回復量など）
    statuses.ts         状態異常の定義と説明
    combat.ts           ダメージ・ブロック・状態異常・勝敗判定
    effects.ts          効果解決（switchで網羅性を型保証）
    cards.ts            カード定義レジストリ（32種）
    enemies.ts          敵・行動プール・激昂設定
    ai.ts               脅威推定と行動スコアリング
    battle.ts           戦闘生成とターンアクション（純粋関数）
    run.ts              連戦・報酬・デッキ進行
    presentation.ts     UI向けラベル
  store/
    gameStore.ts        エンジンの駆動、敵ターンの演出シーケンス、イベント配信
    useGame.ts          useSyncExternalStore 連携
  audio/sfx.ts          WebAudio効果音シンセ
  components/           カード・手札・敵/プレイヤー・意図・FX・モーダル
  screens/              タイトル / マップ / 戦闘 / 報酬 / 決着
  styles/               トークン、レイアウト、カード、戦闘、画面
```

## 設計原則

### 1. エンジンは純粋で、演出を知らない

`playCard` / `endPlayerTurn` / `enemyAct` / `beginPlayerTurn` は状態を受け取り、新しい状態と `GameEvent[]` を返すだけ。ダメージポップアップ、画面揺れ、効果音は `FxLayer` がイベント列を解釈して初めて発生する。ゲームロジックのテストやリプレイにUIが不要。

### 2. 決定論

乱数は各バトルの `rngSeed` に保存され、アクションごとに `Rng` を再構築して書き戻す。同じシードと同じ操作列は常に同じ結果になる。AIのジッターもシード由来。

### 3. データ駆動

- カードは `CARDS` レジストリへの追加だけで、報酬プール・デッキ表示・デバッグが自動追従する。
- 敵は `moves`（効果の配列）と `ai`（性格の重み）を宣言するだけ。技の追加にUI変更は不要。
- 新しい効果は `Effect` ユニオン + `resolveEffect` の switch に追加する。`never` による網羅性チェックで漏れを型が防ぐ。

### 4. 状態と演出の分離

敵ターンは `endPlayerTurn → enemyAct → beginPlayerTurn` をストアが時間差で駆動する。エンジンは即座に全解決するが、UIには「敵の行動 → 着弾 → 次ターン」の順で見える。入力ロック（`busy`）とキャンセルトークンで、リスタート時に古いシーケンスが介入しない。

## 拡張の例

### カードを1枚追加する

```ts
// src/game/cards.ts
frost_lance: {
  id: 'frost_lance',
  name: '氷晶の槍',
  type: 'attack',
  rarity: 'uncommon',
  cost: 1,
  target: 'enemy',
  glyph: '❄️',
  text: '4ダメージ。弱体2を付与。',
  effects: [
    { kind: 'damage', amount: 4 },
    { kind: 'status', status: 'weak', amount: 2, target: 'foe' },
  ],
}
```

これだけで報酬・デッキ表示・AIの脅威推定に乗る（`REWARD_POOL` は自動生成）。

### 敵を追加する

`ENEMIES` に定義を追加し、`ENCOUNTER_SEQUENCE` にIDを並べる。`ai.aggression / defense / cunning` が行動選択の重みになる。`enrage` を書けばHP閾値で覚醒し、技を解禁できる。

### 新しい効果

`types.ts` の `Effect` にケースを追加し、`effects.ts` の `resolveEffect` に実装を書く。`combat.ts` のヘルパー（`performAttack` / `gainBlock` / `applyStatus` など）を再利用する。

### バランス調整

`constants.ts` の `START_HP` / `START_MANA` / `VICTORY_HEAL` / `SKIP_REWARD_HEAL`、`enemies.ts` のHPと技、`ai.ts` の評価係数を調整する。

## 敵AI

`estimatePlayerThreat` が手札・マナ・筋力・弱体を読み、「次のターンに叩き出せる最大火力」を貪欲法で推定する。各行動について以下をHPポイントに換算して比較する。

- 攻撃: ブロックを差し引いた実効ダメージ、リーサル、相手の残HP
- 防御: 推定脅威のうち実際に防げる量、致死回避、自分の残HP
- 強化: 残ターン数とHP余裕、性格 `cunning`
- 妨害: 毒・弱体・脆弱の価値、相手のHP帯
- 同一技の連続使用ペナルティとシード付きジッター

意図は行動前に確定し、UIに「なぜ選んだか」を文字列で渡す。ボスはHP50%で激昂し、筋力を得て連撃を解禁する。

## 検証

- `tsc --noEmit` / `vite build` 成功
- 固定シード40本の自動対戦で、全ランが勝敗に収束
- 検証項目: HP範囲、ブロック非負、手札上限、状態異常非負、敵意図の存在、カード枚数保存則（山札+手札+捨て札+除外+罠 = デッキ枚数）
- 意図を読んで動くヒューリスティックAIで、40本中3勝・ボス到達19回。人間のデッキ構築とリーサル計算を前提にした、挑戦的な難度に調整

## 既知の制約

- セーブ/ロードは未実装（1ランはメモリ上）
- カード強化（アップグレード）やショップ、分岐マップは未実装
- 画面はキーボードとマウスを想定。タッチではカードタップと意図のフォーカスで操作可能
