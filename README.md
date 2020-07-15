# Boilerplate for backstopjs

## Getting started

__パッケージインストール__

`npm i -D backstopjs_boilerplate`

__設定ファイル作成__

[ここを参照](#toc1-1)

__package.json 編集__
```json
"scripts": {
  "bsbl-init": "bsbl path/to/config/your_config.json init",
  "bsbl-reference": "bsbl path/to/config/your_config.json reference",
  "bsbl-test": "bsbl path/to/config/your_config.json test",
  "bsbl-approve": "bsbl approve"
},
```

__テンプレート生成__

`npm run bsbl-init`

__common.json 編集__
```
"tablet": {
+   "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15",
    "viewports": [
        {
            "label": "tablet",
+           "width": 1024,
+           "height": 1366
        }
    ]
},
"phone": {
+   "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1",
    "viewports": [
        {
            "label": "phone",
+           "width": 414,
+           "height": 896
        }
    ]
}
```

__テスト実行__

`npm run bsbl-test`

## 目次

- [:hammer: 動機](#motivation)
- [:scream: 問題点](#problem)
- [:sunglasses: 拡張した機能](#implements)
  - [1. シナリオの自動生成](#toc1)
    - [1-1. 設定ファイルを作成する](#toc1-1)
      - [設定ファイル定義](#toc1-1-1)
        - [templateType](#templateType)
        - [viewports](#viewports)
        - [test と reference](#toc1-1-1-3)
        - [endpoints](#endpoints)
    - [1-2. コマンドの実行](#toc1-2)
  - [2. 同一シナリオファイル内でビューポート毎の記述を可能にする](#toc2)
  - [3. 再利用可能なシナリオ](#toc3)
    - [3-1. シナリオファイル内での再利用](#toc3-1)
    - [3-2. 同一エンドポイント内での再利用](#toc3-2)
      - [3-2-1. 共通操作を切り出したjsonファイルを配置する。](#toc3-2-1)
      - [3-2-2. 配置したファイルの名前を指定する。](#toc3-2-2)
    - [3-3. サイト全体を通した再利用](#toc3-3)
    - [3-4. シナリオの適用順序](#toc3-4)
    - [3-5. カスタムプレフィックス](#toc3-5)
  - [4. engine_scripts のモジュール化](#toc4)
    - [4-1. 拡張操作の実装](#toc4-1)
    - [4-2. 拡張操作の呼び出し](#toc4-2)
- [:cl: コマンド一覧</i>](#toc5)
- [:stuck_out_tongue_winking_eye: 最後に](#toc6)

## <span id="motivation">:hammer: 動機</span>
backstopjsは非常にシンプルなインターフェースで簡単にビジュアルレグレッションテストを導入できるライブラリだったので自分が仕事で担当しているサイトに使ってみた。しかしシンプル過ぎて大量のページや複雑さのあるシナリオが必要なケースでは規則やヘルパーが無さ過ぎて辛い。ので色々と痒い所に手を届かせる規則と機能を追加した。
  
## <span id="problem">:scream: 問題点</span>
#### シナリオを作るのがめんどくさい
ランディングページの様な数ページ程度の規模のサイトであれば手動でも良いが、二桁超えた辺りでシナリオの動的生成がしたくなってくる。
  
#### シナリオの再利用性が考慮されていない
問い合わせフォームの確認・完了のような何かの操作の結果で表示できる状態があったとして、その操作のパターンが途中で分岐しそれぞれに対してテストを実施したい場合、jsonを丸コピするような原始的な方法しか用意されていない。これは長期的に見ると全体を把握することが困難になる気がしてならないしコピーした箇所を仕様変更などで書き換えなければならなくなった時に死ねる。
  
#### シナリオの見通しが悪い
backstopjs では定義されたビューポート毎にスクリーンショットを撮ってくれるがそれ以上のことはできない。もしビューポート毎に異なる操作が必要であればそれは別のシナリオを作らなければならない。ビューポート毎にサイト上で表示されるものや実行される処理が違う事は往々にしてあるので基本として個別にシナリオを書けないと辛い。しかし単純にシナリオを増やしていく形をとると __シナリオを作るのがめんどくさい__ と感じる原因になる。その上 __再利用性が考慮されていない__ ので運用もし難くなる一方となる。
  
#### engine_scripts の呼び出しもシナリオから制御したい
backstopjs 自体が提供するヘッドレスブラウザに対する操作は非常に少なく恐らく作ってる側もビジュアルレグレッションでカバーするテストはこのくらいの機能で実現できるものであるべき。というようなスタンスな気がする。しかし実際に使ってみるとWEBベースの report（画像比較）が秀逸で安心感が凄いのでどんどん網羅的にテストしたくなってくる。しかし、いざ独自セレクタと関数による拡張をしてみるとそこには何の規則もないのでコードとシナリオの関係性が把握し難く保守が難しいと感じた。
  
  
## <span id="implements">:sunglasses: 拡張した機能</span>
### <span id="toc1">1. シナリオの自動生成</span>

全てのエンドポイントに対するテンプレートなシナリオを設定ファイルとコマンドで自動生成する。

#### <span id="toc1-1">1-1. 設定ファイルを作成する</span>
```json
{
    "templateType": "min",
    "viewports": [
        "desktop",
        "phone"
    ],
    "test": "http://your.test.site.com",
    "reference": "http://your.reference.site.com",
    "endpoints": {
        "index": [
            "some_scenario_a",
            "some_scenario_b"
        ],
        "/some_endpoint": [
            "some_scenario_c"
        ],
        "/some_endpoint/some_nested_endpoint": [
            "some_scenario_d"
        ],
        "/some_endpoint/#some_link": [
            "some_scenario_e"
        ]
    }
}
```
単純にスクリーンショットを取るだけの場合は設定ファイルにエンドポイントと適当なシナリオ名を記述するだけでテストが行える。尚、この機能についてはテンプレートが生成されれば良いという軽いノリで実装したのでマイグレーションや差分吸収などという便利なオプションは一切用意していない。

##### <span id="toc1-1-1">設定ファイル定義</span>

###### templateType
コマンドの実行によって生成されるシナリオの初期内容を変更する為の値。[ソース](https://github.com/coremind-jp/backstopjs_boilerplate/blob/master/boilerplate/templates/scenarioEndpoint.json)から使用可能なタイプとその内容を確認する。

###### viewports
viewportsで指定したビューポート数だけシナリオ内に分類情報が追加される。
上記の例の場合、以下のようなシナリオが生成される。これらの分類については機能2, 機能3にて言及している。
```json
{
  "all": {
    "$scripts": [],
    "$subscenarios": [],
  },
  "desktop": {
    "$scripts": [],
    "$subscenarios": []
  },
  "phone": {
    "$scripts": [],
    "$subscenarios": []
  }
}
```

###### <span id="toc1-1-1-3">test と reference</span>
backstopjs における同パラメータと同義。boilerplate では test または reference に対して同一ドメイン内のエンドポイントに焦点を充てている為、異なるドメインを有するシナリオは生成できない。

###### endpoints
key にはスクリーンショットを実行する対象パスを、value にはその対象パスに対するシナリオを配列で記述する。同一ページに対して backstopjs が提供する機能(selectors) では対応できないマルチスクリーンショットを実行したい場合でも個別にシナリオ定義を追記する事で簡単に実現できる。またページ内リンクやネストしたパスを持つエンドポイント（例では /some_endpoint/some_nested_endpoint や /some_endpoint/#some_link）はその全部を一つのエンドポイントとして扱う。index は特殊な値で `/` に対する定義と解釈される。

#### <span id="toc1-2">1-2. コマンドの実行</span>
`node_modules/backstopjs_boilerplate/boilerplate/runner.js init config.json`

または、package.json の scripts ブロック内では以下の形でも実行可能。

`bsbl init config.json`

渡された設定ファイルが置かれているディレクトリ上にシナリオのテンプレートを生成する。（上記の設定ファイルによる生成結果を以下に記載）また boilerplate はシナリオのテンプレートを生成する際に backstop.json を必要とするため、__暗黙的に `backstop init` も実行する。__

    - ./
      - config.json
      - common.json
      - ${engine}_scripts.js
      - index
        - some_scenario_a.json
        - some_scenario_b.json
      - /some_endpoint
        - some_scenario_c.json
      - /some_endpoint_some_nested_endpoint
        - some_scenario_d.json
      - /some_endpoint_-somelink
        - some_scenario_e.json

その他のコマンドについては[コマンド一覧](#toc5)参照

### <span id="toc2">2. 同一シナリオファイル内でビューポート毎の記述を可能にする</span>

当初、何も考えずに各ビューポート毎にシナリオを分けて作ってみたものの全体を把握するのが容易ではないと感じたので、同一シナリオファイル内にビューポート毎の記述ができるような構成にした。ビューポート毎の差異程度であれば寧ろ同じファイルに記述されていた方が見通しが良い。例に使用した設定ファイルで例えると ___desktop, phone___ というviewpoirtを指定しているので、生成されるシナリオファイルは以下のような形になる。 __allブロック__ については後述。
```
{
    "all": {
        something...
    },
    "desktop": {
        something...
    },
    "phone": {
        something...
    }
}
```
    
### <span id="toc3">3. 再利用可能なシナリオ</span>

シナリオの再利用は大きく三ヵ所で行える。

#### <span id="toc3-1">3-1. シナリオファイル内での再利用</span>
__機能2.__ で出てきた __allブロック__ 。ここに記述した操作はそのシナリオの全ビューポートに対して適用される。

#### <span id="toc3-2">3-2. 同一エンドポイント内での再利用</span>

同一エンドポイント内には異なるシナリオが作成できるが、時として各シナリオで共通の操作がある。そのような場合に利用する。

##### <span id="toc3-2-1">3-2-1. 共通する操作のみを切り出したjsonファイルを対象のエンドポイントのディレクトリに配置する。</span>

    - ./
      - config.json
      - index
        - some_scenario_a.json
        - some_scenario_b.json
        - sheared_scenario.json              //some_scenario_a と some_scenario_b の全ビューポートで共通操作
        - sheared_scenario_only_desktop.json //some_scenario_a と some_scenario_b の desktop のみの共通操作
        - sheared_scenario_only_phone.json   //some_scenario_a と some_scenario_b の phone のみの共通操作

注意点としては、以下のように配置するファイル内ではビューポート毎の記述(_all_, _desktop_, _phone等_)はしない。
```
./index/sheared_scenario.json
{
    "clickSelectors": [
        ".click"
    ],
    something...
}
```

##### <span id="toc3-2-2">3-2-2 シナリオ内で ___$subscenarios___ キーに配置したファイルの名前を指定する。</span>
___$subscenarios___ キーはビューポート毎に指定できるので細かく制御可能になっている。
```
./index/scenario_a.json & ./index/scenario_b.json
{
    "all": {
        "$subscenarios": [
+           "sheared_scenario"
        ],
        something ...
    },
    "desktop": {
        "$subscenarios": [
+           "sheared_scenario_only_desktop"
        ],
        something ...
    },
    "phone": {
        "$subscenarios": [
+           "sheared_scenario_only_phone"
        ],
        something ...
    }
}
```

#### <span id="toc3-3">3-3. サイト全体を通した再利用</span>

`init` で生成された _common.js_ 。ここに記述した操作は全てのシナリオに反映される。注意してほしいのは、このファイルにはシナリオで定義可能な全てのプロパティについてデフォルト値が記述されている。（つまりそれらの値について backstopjs.json の値を一切利用しない）

#### <span id="toc3-4">3-4. シナリオの適用順序</span>

一つのシナリオを出力する際にいくつものシナリオ(json)が関わってくるため、読み込まれる順序を理解する必要がある。

1. 最も優先度が高いのは設定ファイルに定義されているシナリオ。
2. 次に設定ファイルの中で定義されている _$subscenarios_ 配列が示すシナリオ。
3. 次が _common.json_ で定義される操作
4. 最後に _common.js_ の中で定義されている _$subscenarios_ 配列が示すシナリオ。
  
_$subscenarios_ 配列は先頭から積み上げていくので配列に複数のシナリオが含まれる場合、前方より後方が優先される。

#### <span id="toc3-5">3-5. カスタムプレフィックス</span>

__「再利用」__ 時に記述内容に重複があった場合、具体的にどの様にデータに作用するのか。そしてどの様な操作オプションがあるのか。

シナリオを上書きしたいと思った場合、数値や文字列などのプリミティブ型であれば代入以外の選択肢は無いが、配列には二通りの上書きが存在する。一つはプリミティブ同様に単純な上書き、もう一つは既存の配列に対するマージ。
  
他方、特定のシナリオを実行する場合にのみ、再利用したシナリオの一部操作を除外したいという特殊なケースもある。boilerplate ではカスタムプレフィックスを利用してそれらの制御ができるようになっている。

シナリオに含まれるさまざまな操作にカスタムプレフィックスを付けることで最終的なシナリオの形を柔軟に制御できる。オブジェクトやプリミティブな値を保持するキーにカスタムプレフィックスを指定しても意味はない。配列を保持するキーにカスタムプレフィックスの指定が無い場合、 `+:` として扱われる。

| prefix | description |
|:----:|----|
| +: | 対象配列にマージする。配列内で重複が見つかった場合、後方の値を破棄する |
| -: | 対象配列に含まれる同じ値を取り除く |
| =: | 配列全体を入れ替える |

__例__
  
上書き元
```json
{
    "clickSelectors": [
        ".someelement-1",
        ".someelement-2",
        ".someelement-3"
    ],
    "hoverSelectors": [
        ".someelement-4"
    ],
}
```

上書き内容
```json
{
    "-:clickSelectors": [
        ".someelement-1",
        ".someelement-3"
    ],
    "clickSelectors": [
        ".someelement-2",
        ".someelement-4"
    ],
    "=:hoverSelectors": [
        ".overwrite"
    ]
}
```

上書き結果
```json
{
    "clickSelectors": [
        ".someelement-2",
        ".someelement-4"
    ],
    "hoverSelectors": [
        ".overwrite"
    ]
}
```

### <span id="toc4">4. engine_scripts のモジュール化</span>

既存の backstopjs でも onBefore, onReady を活用したユーザー定義の engine_script に対するモジュール化は実現されているが、そこには明確なコーディングルールがないため、それらの呼び出しに関する設計とその実装に時間を取られてしまう。boilerplate では規則を設け、それに沿って実装することでエンジンを操作するためのコードを集中して書けるようにしている。また、記述した拡張コードはシナリオから脱着可能にして素早く試行錯誤できるようにしている。
  
#### <span id="toc4-1">4-1. 拡張操作の実装</span>

boilerplate では engine_scripts の エントリーポイントは onBefore, onReady ではなく、`init` で生成された _\${engine}\_scripts.js_ となる。 _${engine}_ はテストに使用しているエンジンの名前となる。（デフォルトではpuppeteer）
onBefore, onReady は `init` 実行時にシナリオから制御するためのフック関数へ書き換えられる。

[_\${engine}\_scripts.js_](https://github.com/coremind-jp/backstopjs_boilerplate/blob/master/boilerplate/templates/engine_scripts.js) を見ると分かるが、このモジュール関数は _preimplements_ 引数が渡されている。このオブジェクトの中には backstopjs が提供する _clickAndHoverHelper_ , _loadCookies_ , _overrideCSS_ の実装が含まれる。（_ignoreCSP_ , _interceptImages_ については追加のパッケージが必要なので含めていない） もしこれらの実行タイミングを制御したいのであればこのオブジェクトから取り出して任意のタイミングで呼び出すことができる。

再利用を意識した単位で記述すれば1ファイルでも十分だと思うが、気になる場合は _preimplements_ の様に意味ある塊ごとに外部ファイル化し、後からこのファイルのモジュールとして割り当てると良い。

シナリオは _{engine}\_scripts.js_ で定義されるオブジェクトのキーを使って呼び出しを制御する。

__例__

実装例
```js
./puppeteer_scripts.js
module.exports = preimplements => ({
    ...preimplements,
    
    // bodyに設定されているheightスタイルをautoに書き換える
    overwriteBodyHeight: async function(page, scenario, vp) {
        await page.addStyleTag({ content: `body { height: auto !important; }` });
    },

    // 指定秒数待機する
    wait: async function(page, scenario, vp, ms) {
        await page.waitFor(ms);
    },
});
```

#### <span id="toc4-2">4-2. 拡張操作の呼び出し</span>

シナリオ内から拡張操作を呼び出すには、 _$scripts_ 配列に関数名を記述する。onBefore, onReady の２つの呼び出しタイミングを制御するためにカスタムプレフィックスを利用する。また関数名の後に `:` で区切った値を加えるとその値を引数として関数へ渡すことができる。（例では _wait_ 関数の _ms_ 引数がそれを利用している）

実行順序に関しては、_before_ プレフィックスが付いているものは、_ready_ プレフィックスが付いているものよりも必ず先に呼ばれる。同じプレフィックス同士の優先順位は配列への追加順となる。

| prefix | description |
|:----:|----|
| before: | 指定した関数をonBefore時に呼び出す |
| ready: | 指定した関数をonReady時に呼び出す |

__例__

シナリオ
```json
.index/scenario_a.js
{
    "all": {
        "$subscenarios": [
            "sheared_scenario"
        ],
        "$scripts": [
+           "before:wait:1000",
        ],
    },
    "desktop": {
        "$subscenarios": [
            "sheared_scenario",
            "sheared_scenario_only_desktop"
        ],
        "$scripts": [
+           "ready:overwriteBodyHeight"
        ]
    },
    "phone": {
        "$subscenarios": [
            "sheared_scenario",
            "sheared_scenario_only_phone"
        ]
    }
}
```

## <span id="toc5">:cl: コマンド一覧</span>

#### init

- `bsbl init config.json`
[コマンドの実行](#toc1-2)を参照

#### test

- `bsbl test config.json filter`

_config.json_ に従ってシナリオを生成し backstopjs test を実行する。シナリオのラベル命名規則は以下の通りとなっている。_filter_ へ渡す値の参考にすると良い。

{endpoint}:{scenario}\:{viewport}

#### reference

- `bsbl reference config.json filter`

_config.json_ に従ってシナリオを生成し backstopjs reference を実行する。シナリオのラベル命名規則は以下の通りとなっている。_filter_ へ渡す値の参考にすると良い。

{endpoint}:{scenario}\:{viewport}

#### その他のコマンドに対する挙動
`bsbl` への第一引数が `init`, `test`, `reference` 以外の場合、全ての引数を backstopjs へ移譲し boilerplate は何もしない。（つまり `bsbl approve` は `backstopjs approve` と同じとなる）

### <span id="toc6">:stuck_out_tongue_winking_eye: 最後に</span>
既存の backstopjs が提供するディレクトリ構成や設定（backstop.json）にシナリオのデフォルトが定義されている点などが扱い難い（個人的に編集対象となるファイルが散らばっている状況は好きになれない）と感じていたのでこの形に落ち着いた。何か提案等があったらpull requestやメール等を頂ければリアクションします。（多分）