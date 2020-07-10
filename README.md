# backstopjs用ボイラープレート

## 動機
backstopjsは非常にシンプルなインターフェースで簡単にビジュアルレグレッションテストを導入できるライブラリだったので自分が仕事で担当しているサイトに使ってみた。しかしシンプル過ぎて大量のページや複雑さのあるシナリオが必要なケースでは規則やヘルパーが無さ過ぎて辛い。ので色々と痒い所に手を届かせる規則と機能を追加した。
  
## 問題点
### 問題1. シナリオを作るのがめんどくさい
ランディングページの様な数ページ程度の規模のサイトであれば手動でも良いが、二桁超えた辺りでシナリオの動的生成がしたくなってくる。
  
### 問題2. シナリオの再利用性が考慮されていない
問い合わせフォームの確認・完了のような何かの操作の結果で表示できる状態があったとして、その操作のパターンが途中で分岐しそれぞれに対してテストを実施したい場合、jsonを丸コピするような原始的な方法しか用意されていない。これは長期的に見ると全体を把握することが困難になる気がしてならないしコピーした箇所を仕様変更などで書き換えなければならなくなった時に死ねる。
  
### 問題3. シナリオの見通しが悪い
backstopjsでは定義されたviewport毎にスクリーンショットを撮ってくれるがそれ以上のことはできない。もしviewport毎に異なる操作が必要であればそれは別のシナリオを作らなければならない。viewport毎にサイト上で表示されるものや実行される処理が違う事は往々にしてあるので基本として個別にシナリオを書けないと辛い。しかし単純にシナリオを増やしていく形をとると __問題1__ を誘発する原因になる。その上 __問題2__ があるので運用もし難くなる一方となる。
  
### 問題4. engine_scriptsの呼び出しもシナリオから制御したい
backstopjs自体が提供するヘッドレスブラウザに対する操作は非常に少なく恐らく作ってる側もビジュアルレグレッションでカバーするテストはこのくらいの機能で実現できるものであるべき。というようなスタンスな気がする。しかし実際に使ってみるとWEBベースのreport（画像比較）が秀逸で安心感が凄いのでどんどん網羅的にテストしたくなってくる。しかし、いざ独自セレクタと関数による拡張をしてみるとそこには何の規則もないのでコードとシナリオの関係性が把握し難く保守が難しいと感じた。
  
  
## 拡張した機能
### 機能1. シナリオの自動生成
全てのエンドポイントに対するテンプレートなシナリオを設定ファイル(site.json)とコマンドで自動生成する。単純にスクリーンショットを取るだけの場合はこれだけでテストが行える。viewportsは任意の名称(label)を持たせることができる。尚、この機能についてはテンプレートが生成されれば良いという軽いノリで実装したのでマイグレーションなどという便利なオプションは一切用意していない。
#### コマンド
`node ./boilerplate/core/generate.js`
#### 設定ファイル (site.json)
    ./boilerplate/site.json 
    {
        "test": "http://server.address.for.test.com",
        "reference": "https://server.address.for.reference.com",
        "ua": {
            "desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100",
            "phone": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1"
        },
        "viewports": [
            {
                "label": "desktop",
                "width": 1920,
                "height": 1024
            },
            {
                "label": "phone",
                "width": 600,
                "height": 900
            }
        ],
        "endpoints": {
            "index": [
                "scenario1",
                "scenario2"
            ],
            "/endpoint1": [
                "scenario1",
                "scenario2"
            ]
        }
    }
#### 例（上記json）で生成されるファイル・ディレクトリとその構成（太字表記のデータが自動生成によるもの）
__common.json, ${engine}_manupulation.js__ については後述。

- root (npm実行階層)
  - boilerplate
    - core (boilerplateソースファイル)
    - __endpoints__
      - __index__ (トップページ)
        - __scenario1.json__ (トップページに対するシナリオ１)
        - __scenario2.json__ (トップページに対するシナリオ２)
      - __endpoint1__ (べージ１)
        - __scenario1.json__ (ページ１に対するシナリオ１)
        - __scenario2.json__ (ページ１に対するシナリオ２)
      - __common.json__ (サイト全体に対するシナリオ)
    - site.json (設定ファイル)
    - __${engine}\_manupulation.js__
    
### 機能2. 同一シナリオファイル内でviewport毎の記述を可能に
当初、何も考えずに各viewport毎にシナリオを分けて作ってみたものの全体を把握するのが容易ではないと感じたので、同一シナリオファイル内にviewport毎の記述ができるような構成にした。viewport毎の差異程度であれば寧ろ同じファイルに記述されていた方が見通しが良い。例に使用した __site.json__ で例えると ___desktop, phone___ というviewpoirtを指定しているので、生成されるシナリオファイルは以下のような形になる。 __allブロック__ については後述。

    ./boilerplate/endpoints/index/scenario1.json 
    {
        "all": {
            something ...
        },
        "desktop": {
            something ...
        },
        "phone": {
            something ...
        }
    }  
    
### 機能3. 再利用可能なシナリオ
シナリオの再利用は大きく三ヵ所で行えるようにした。

#### 3-1. シナリオファイル内での再利用
__機能2.__ で出てきた __allブロック__ 。ここに記述した操作はそのシナリオの全viewportに対して適用される。

#### 3-2. 同一エンドポイント内での再利用
同一エンドポイント内には異なるシナリオが作成できるが、時として各シナリオで共通の操作がある。そのような場合に利用する。

##### 3-2-1. 共通する操作のみを切り出したjsonファイルを対象のエンドポイントのディレクトリに配置する。
最初の例に反映させると以下のようになる。

- root (npm実行階層)
  - boilerplate
    - endpoints
      - endpoint1
        - scenario1.json
        - scenario2.json
        - __sheared_scenario__ (scenario1, scenario2, 全viewportで共通操作)
        - __sheared_scenario_only_desktop__ (scenario1, scenario2のdesktopのみの共通操作)
        - __sheared_scenario_only_phone__ (scenario1, scenario2のphoneのみの共通操作)


_注意点としては配置するファイル内ではviewport別の記述(例の場合、all, desktop, phone等)はしない。_
    
    ./boilerplate/endpoints/endpoint1/sheared_scenario.json
    {
        "clickSelectors": [
            ".click"
        ],
        something ...
    }
    
##### 3-2-2 シナリオ内で ___$subScenarios___ キーに __3-2-1__ で配置したファイルの名前を指定する。
このキーはviewport毎に指定できるので細かく制御可能になっている。

    ./boilerplate/endpoints/endpoint1/scenario1.json & ./boilerplate/endpoints/endpoint1/scenario2.json
    {
        "all": {
    |       "$subScenarios": [
    |           "sheared_scenario"
    |       ],
            something ...
       },
        "desktop": {
    |       "$subScenarios": [
    |           "sheared_scenario_only_desktop"
    |       ],
            something ...
        },
        "phone": {
    |       "$subScenarios": [
    |           "sheared_scenario_only_phone"
    |       ],
            something ...
        }
    }

#### 3-3. サイト全体を通した再利用

__機能1.__ で生成された __common.js__ 。ここに記述した操作は全てのシナリオに反映される。基本設定として捉えると良い。

#### 3-4. シナリオの適用順序

一つのシナリオを出力する際にいくつものシナリオ(json)が関わってくるため、読み込まれる順序を理解する必要がある。

1. 最も優先度が高いのは __site.json__ で定義されているシナリオ。
2. 次に __site.json__ の中で定義されている ___$subScenarios___ 配列が示すシナリオ。
3. 次が __common.js__ で定義される操作
4. 最後に __common.js__ の中で定義されている ___$subScenarios___ 配列が示すシナリオ。
  
___$subScenarios___ 配列は先頭から積み上げていくので配列に複数のシナリオが含まれる場合、前方より後方が優先される。

#### 3-5. カスタムプレフィクス

__「再利用」__ は具体的にデータをどの様に作用させるのかという点について説明をする。シナリオを上書きしたいと思った場合、数値や文字列などのプリミティブ型であれば代入以外の選択肢は無いが、配列には二通りの上書きが存在する。一つはプリミティブ同様に単純な上書き、もう一つは既存の配列に対するマージ。
  
他方、特定のシナリオを実行する場合にのみ、再利用したシナリオの一部操作を除外したいという特殊なケースもある。boilerplateではカスタムプレフィクスを利用してそれらの制御ができるようになっている。カスタムプレフィクスはシナリオに含まれる操作（clickSelectors, hoverSelectors等）にプレフィクスを付けることでシナリオ出力の制御を切り替える。カスタムプレフィクスは対象キーが保持する値が配列であればシナリオ内に定義されるあらゆる要素に適用できる。objectやプリミティブなキーにカスタムプレフィクスを指定しても意味はない。
  
カスタムプレフィクスを持たない要素に配列が設定されている場合、 `+:` として扱われる。

| prefix | description |
----|---- 
| +: | 既存の配列にマージする。配列内で重複が見つかった場合、後方を破棄する(default) |
| -: | 既存の配列から指定した値を取り除く |
| =: | 配列全体を入れ替える |

__例__
  
上書き元

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
    
上書き内容

    {
        "-:clickSelectors": [
            ".someelement-1",
            ".someelement-3"
        ],
        "clickSelectors": [
            ".someelement-2",
            ".someelement-4"
        ]
        "=:hoverSelectors": []
    }

上書き結果

    {
        "clickSelectors": [
            ".someelement-2",
            ".someelement-4"
        ]
        "hoverSelectors": []
    }

### 4. engine_scriptのモジュール化

既存のbackstopjsでもonBefore, onReadyを活用したengine_scriptのモジュール化は実現されているが、規則が漠然としているため設計とその実装に時間を取られる。boilerplateでは規則を設け、それに沿って実装することでエンジンを操作するためのコードを集中して書けるようにしている。また、記述した拡張コードはシナリオから脱着可能にして素早く試行錯誤できるようにしている。
  
#### 4-1. 拡張操作の実装

__機能1.__ で生成された ___${engine}\_manupulation.js___ に実装する。 ___${engine}___ はテストに使用しているエンジンの名前となる（デフォルトではpuppeteer）。再利用を意識した単位で記述すれば1ファイルでも十分把握可能だと思うが、気になる場合は意味ある塊ごとに外部ファイル化して後からこのファイルのモジュールとして割り当てれば良い。 このファイルの _module.exports_ に関数を割り当てて行き、シナリオからはその関数名を指定する。

__例__

実装例

    ./boilerplate/puppeteer_manupulation.js
    const { ROOT } =  require("./core/directory_path");
    const loadCookies = require(`${ROOT}\\backstop_data\\engine_scripts\\puppet\\loadCookies.js`);
    const clickAndHoverHelper = require(`${ROOT}\\backstop_data\\engine_scripts\\puppet\\clickAndHoverHelper.js`);
    
    module.exports = {
        // default function defined from onBefore.js
        loadCookies,

        // default function defined from onReady.js
        clickAndHoverHelper,

        // user-agentを設定する.
        setUserAgent: async function(page, scenario, vp) {
            await page.setUserAgent(site.ua[vp.label]);
        },

        // bodyに設定されているheightスタイルをautoに書き換える
        overwriteBodyHeight: async function(page, scenario, vp) {
            await page.addStyleTag({ content: `body { height: auto !important; }` });
        },
        
        // 指定秒数待機する
        wait: async function(page, scenario, vp, ms) {
            await page.waitFor(ms);
        },
    }

#### 4-2. 拡張操作の呼び出し

シナリオ内から拡張操作を呼び出すには、 ___$scripts___ 配列に実行順に沿って関数名を記述する。ここでもonBefore, onReadyの２つの呼び出しタイミングを制御するためにカスタムプレフィクスを利用する。また、関数名の後に `:` で区切った値を加えるとその値を引数として関数へ渡すことができる。

| prefix | description |
----|---- 
| before: | 指定した関数をonBefore時に呼び出す |
| ready: | 指定した関数をonReady時に呼び出す |

__例__

シナリオ

    ./boilerplate/endpoints/endpoint1/scenario.js
    {
        "all": {
            "$subScenarios": [
                "sheared_scenario"
            ],
    |       "$scripts": [
    |           "before:setUserAgent"
    |       ],
       },
        "desktop": {
            "$subScenarios": [
                "sheared_scenario",
                "sheared_scenario_only_desktop"
            ],
    |       "$scripts": [
    |           "after:wait:1000",
    |           "after:overwriteBodyHeight"
    |       ],
            something ...
        },
        "phone": {
            "$subScenarios": [
                "sheared_scenario",
                "sheared_scenario_only_phone"
            ],
            something ...
        }
    }
        

