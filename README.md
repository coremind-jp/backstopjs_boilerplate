![Node.js CI](https://github.com/coremind-jp/backstopjs_boilerplate/workflows/Node.js%20CI/badge.svg?branch=master)

# Boilerplate for backstopjs


## <span id="started">:rabbit: Getting started

__パッケージインストール__

`npm i -D backstopjs backstopjs_boilerplate`

__package.json 編集__
```json
"scripts": {
  "init": "backstop init && bsbl init",
  "sync": "bsbl sync",
  "watch": "bsbl watch",
  "test": "bsbl test && backstop test",
  "reference": "bsbl reference && backstop reference"
},
```

__初期化__

`npm run init` 

__テンプレート生成__

手動による生成

`npm run sync`

または [chokidar](https://www.npmjs.com/package/chokidar) を利用したファイル監視による自動生成

`npm run watch`

__テスト実行__

`npm run reference` and  `npm run test`

## 目次
- [:cl: コマンド一覧](#cmd)
- [:hammer: 動機](#motivation)
- [:scream: 問題点](#problem)
- [:sunglasses: 拡張した機能](#implements)
  - [1. シナリオの自動生成](#toc1)
    - [1-1. 設定ファイルを作成する](#toc1-1)
      - [設定ファイル定義](#toc1-1-1)
        - [templateType](#templateType)
        - [test と reference](#toc1-1-1-3)
        - [endpoints](#endpoints)
        - [skip](#skip)
    - [1-2. テンプレートの生成](#toc1-2)
  - [2. 同一シナリオファイル内でビューポート毎の記述を可能にする](#toc2)
  - [3. 再利用可能なシナリオ](#toc3)
    - [3-1. シナリオファイル内での再利用](#toc3-1)
    - [3-2. 同一エンドポイント内での再利用（サブシナリオ）](#toc3-2)
    - [3-3. サイト全体を通した再利用](#toc3-3)
    - [3-4. シナリオの適用順序](#toc3-4)
    - [3-5. カスタムプレフィックス](#toc3-5)
    - [3-6. カスタムプレフィックスの適用順序](#toc3-6)
  - [4. engine_scripts のモジュール化](#toc4)
    - [4-1. 拡張操作の実装](#toc4-1)
    - [4-2. 拡張操作の呼び出し](#toc4-2)

## <span id="cmd">:cl: コマンド一覧</span>
package.json内からであれば `bsbl` として呼び出すことができる。
通常のコマンドラインでは `node_modules/backstopjs_boilerplate/boilerplate/cli.js` に対してサブコマンドを渡す必要がある。

#### init
`bsbl init [path]`

__事前に`backstop init`が実行済みでなければならない。__
  
`[path]`には _backstop.json_ へのパスを指定する。省略した場合、_./backstop.json_ として扱われる。

_backstop_data/_ 内に boilerplate のためのディレクトリと設定ファイル（_boilerplate.json_）を生成し、onBefore, onReady の動作を書き換える。書き換えについては[「engine_scripts のモジュール化」](#toc4)を参照。

#### sync
`bsbl sync [path]`

__事前に`bsbl init`が実行済みでなければならない。__ 
  
`[path]`には _backstop.json_ へのパスを指定する。省略した場合、_./backstop.json_ として扱われる。

設定ファイル（_boilerplate.json_）内のシナリオ定義を利用して _backstop_data/boilerplate/_ 内のディレクトリとファイルを同期する。設定ファイル内にシナリオの定義が存在していて、その定義が示すディレクトリやファイルが存在しない場合はそれらを生成する。既に存在しているファイルに対しては何も行わない。設定ファイル内のシナリオ定義に一致しないディレクトリやファイルが存在する場合はそれらを削除する。基本的にディレクトリとファイルの生成・削除は手動で行わず、設定ファイルの編集と `bsbl sync` コマンドで行う。

#### watch
`bsbl watch [path]`

__事前に`bsbl init`が実行済みでなければならない。__ 
  
`[path]`には _backstop.json_ へのパスを指定する。省略した場合、_./backstop.json_ として扱われる。

_chokidar_ を利用して _backstop_data/boilerplate/_ 内の _json_ ファイルを監視し、変更があった際に `bsbl sync` を暗黙的に呼び出すラッパーコマンド。

#### test, reference
`bsbl test [path]`　`bsbl reference [path]`

__`backstop test` `backstop reference` を実行する前に実行しなければならない。__
  
`[path]`には _backstop.json_ へのパスを指定する。省略した場合、_./backstop.json_ として扱われる。

_backstop_data/boilerplate/_ 内のシナリオを全てマージして _backstop.json_ の _scenarios_ キーにアサインする。各シナリオのラベル命名規則は以下の通りとなっている。

__{endpoint}:{scenario}\:{viewport}__

__javascript による backstopjs との統合__

backstopjs と boilerplate の連携を javascript で行いたい場合は、`init`コマンドで生成される _integration_example.js_ を参照。
```js
const backstop = require("backstopjs");
const boilerplate = require("backstopjs_boilerplate");

const cmd = process.argv[2];
const cnf = process.argv[3] || require("path").join(process.cwd(), "backstop.json");

switch (cmd) {
  case "init":
    backstop(cmd).then(() => boilerplate(cmd, cnf));
    break;

  case "sync":
    boilerplate(cmd, cnf);
    break;

  case "test":
  case "reference":
    boilerplate(cmd, cnf).then(() => backstop(cmd, { config: require(cnf) }));
    break;
}
```

## <span id="motivation">:hammer: 動機</span>
backstopjsは非常にシンプルなインターフェースで簡単にビジュアルレグレッションテストを導入できるライブラリだったので自分が仕事で担当しているサイトに使ってみた。しかしシンプル過ぎて大量のページや複雑さのあるシナリオが必要なケースでは規則やヘルパーが無さ過ぎて辛い。ので色々と痒い所に手を届かせる規則と機能を追加した。
  
## <span id="problem">:scream: 問題点</span>
#### シナリオを作るのがめんどくさい
ランディングページの様な数ページ程度の規模のサイトであれば手動でも良いが、二桁超えた辺りでシナリオの動的生成がしたくなってくる。
  
#### シナリオの再利用性が考慮されていない
問い合わせフォームの確認・完了のような何かの操作の結果で表示できる状態があったとして、その操作のパターンが途中で分岐しそれぞれに対してテストを実施したい場合、jsonを複製するような原始的な方法しか用意されていない。これは長期的に見ると全体を把握することが困難になる気がしてならないし複製した箇所を仕様変更などで書き換えなければならなくなった時に死ねる。
  
#### シナリオの見通しが悪い
backstopjs では定義されたビューポート毎にスクリーンショットを撮ってくれるがそれ以上のことはできない。もしビューポート毎に異なる操作が必要であれば別のシナリオを作らなければならない。ビューポート毎にサイト上で表示されるものや実行される処理が違う事は往々にしてあるので前提として個別にシナリオを書けないと辛いと感じた。しかし単純にシナリオを増やしていく形をとると __シナリオを作るのがめんどくさい__ と感じる原因になる。その上 __再利用性が考慮されていない__ ので保守が難くなる。
  
#### engine_scripts の呼び出しもシナリオから制御したい
backstopjs 自体が提供するヘッドレスブラウザに対する操作は非常に少なく恐らく作ってる側もビジュアルレグレッションでカバーするテストはこのくらいの機能で実現できるものであるべき。というようなスタンスな気がする。しかし実際に使ってみるとWEBベースの report（画像比較）が秀逸で凄い安心感なので網羅的にテストしたくなってくる。そしていざ独自セレクタと関数による拡張をしてみるとそこには何の規則もないのでコードとシナリオの関係性が把握し難く保守が難しいと感じた。
  
## <span id="implements">:sunglasses: 拡張した機能</span>
### <span id="toc1">1. シナリオの自動生成</span>

全てのエンドポイントに対するテンプレートなシナリオを設定ファイルとコマンドで自動生成する。

#### <span id="toc1-1">1-1. 設定ファイルを作成する</span>
`init` コマンドを実行すると、_backstop_data/_ 内に _boilerplate_ というディレクトリと _boilerplate.json_ というファイルを生成する。このファイルを編集して自動生成するテンプレートを制御する。またテンプレートの生成場所は _backstop_data/boilerplate/_ 内に生成される。

##### <span id="toc1-1-1">設定ファイル定義</span>
```
./backstop_data/boilerplate/boilerplate.json
{
  "templateType": "min",
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
    ],
    "/empty_endpoint": []
  },
  "skip": {
    "when": "reference",
    "endpoints": {

    }
  }
}
```

単純にスクリーンショットを取るだけの場合は設定ファイルの _test_, _reference_ に URL、_endpoints_ に適当なエンドポイントと空の配列を記述するだけでテストが行える状態になる。

###### templateType
コマンドの実行によって生成されるシナリオの初期内容を変更するための値。使用可能なタイプは[テンプレート](https://github.com/coremind-jp/backstopjs_boilerplate/blob/master/boilerplate/templates/endpoint.json)を参照。

###### <span id="toc1-1-1-3">test と reference</span>
backstopjs における同パラメータと同義。シナリオ毎に異なるドメインを有するシナリオは生成する際は個々のシナリオで _url_ を書き換える。

###### endpoints
key にはスクリーンショットを実行する対象パスを、value にはその対象パスに対するシナリオを配列で記述する。

_index_ は特殊な値で `/` に対する定義と解釈される。

同一ページに対して backstopjs が提供する機能(selectors) では対応できないマルチスクリーンショットを実行したい場合に個別にシナリオ定義を追記して実現する。またページ内リンクやネストしたパスを持つエンドポイント（例では _/some_endpoint/some_nested_endpoint_ や _/some_endpoint/#some_link_）はその全部を一つのエンドポイントとして扱う。

空配列（例では _/empty_endpoint_）として定義すると`test` コマンドや `reference` コマンドで出力されるシナリオにのみ含まれ、テンプレートファイル自体は生成されない。

###### skip
_when_ には `test` または `reference` を指定する。指定された方でシナリオの生成が行われた場合 _skip_ 内の _endpoints_ とマッチするシナリオを除外する。boilerplate における `test`, `reference` の処理の違いはこの点のみなっている。backstopjs の _filter_ がホワイトリストなのに対して、このパラメータはブラックリストの役割をはたしている。

空配列として定義するとそのエンドポイントに含まれる全てのシナリオ出力がスキップされる

#### <span id="toc1-2">1-2. テンプレートの生成</span>
`sync` コマンドを実行するとその時点の _boilerplate.json_ の内容に従って _backstop_data/boilerplate/_ 下に各シナリオが生成される。

__例__ [「設定ファイルを作成する」](#toc1-1)の定義による生成結果
```
./backstop_data
    /boilerplate
        boilerplate.json
        ${engine}_scripts.js
        /_common
            common.json
        /index
            some_scenario_a.json
            some_scenario_b.json
        /some_endpoint
            some_scenario_c.json
        /some_endpoint_some_nested_endpoint
            some_scenario_d.json
        /some_endpoint_-somelink
            some_scenario_e.json
```

### <span id="toc2">2. 同一シナリオファイル内でビューポート毎の記述を可能にする</span>

当初、何も考えずに各ビューポート毎にシナリオを分けて作ってみたものの全体を把握するのが容易ではないと感じたので、同一シナリオファイル内にビューポート毎の記述ができるような構成にした。ビューポート毎の差異程度であれば寧ろ同じファイルに記述されていた方が見通しが良い。生成直後の backstop.json の viewports には _tablet, phone_ という値が設定されているので、何も手を加えなかった場合に生成されるシナリオは以下の形になる。 _all_ ブロックに記述した操作はそのシナリオの全ビューポートに対して適用される。
```
{
  "all": {
    something...
  },
  "tablet": {
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
[「2. 同一シナリオファイル内でビューポート毎の記述を可能にする」](#toc2) の _all_ ブロック。(ビューポート間共有)

#### <span id="toc3-2">3-2. 同一エンドポイント内での再利用（サブシナリオ）</span>

同一エンドポイント内には複数のシナリオを定義できるが、時として各シナリオで共通操作が存在しそれらを一か所で定義したい場合がある。そのような場合に利用する。(シナリオ間共有)

便宜的にこの共通操作を記述した json ファイルを ___サブシナリオ___ を命名している。 

シナリオ内の _$subscenarios_ 配列に任意のサブシナリオ名を追加して `bsbl sync` コマンドを実行するとその名前を持つファイルがディレクトリ内に生成される。

サブシナリオの中で再帰的に _$subscenarios_ を定義することはできない。

```
./backstop_data/boilerplate/index/scenario_a.json
./backstop_data/boilerplate/index/scenario_b.json
{
  "all": {
    "$subscenarios": [
+     "sheared_scenario"
    ],
    something ...
  },
  "tablet": {
    "$subscenarios": [
+     "sheared_scenario_only_tablet"
    ],
    something ...
  },
  "phone": {
    "$subscenarios": [
+     "sheared_scenario_only_phone"
    ],
    something ...
  }
}
```

`bsbl sync` コマンド実行後

```
./backstop_data
    /boilerplate
        /index
            some_scenario_a.json
            some_scenario_b.json
+           sheared_scenario.json              //some_scenario_a と some_scenario_b の全ビューポートで共通操作
+           sheared_scenario_only_tablet.json  //some_scenario_a と some_scenario_b の tablet のみの共通操作
+           sheared_scenario_only_phone.json   //some_scenario_a と some_scenario_b の phone のみの共通操作
```

#### <span id="toc3-3">3-3. サイト全体を通した再利用</span>

`init` コマンドで生成された _common.js_ 。ここに記述した操作は全てのシナリオに反映される。

#### <span id="toc3-4">3-4. シナリオの適用順序</span>

一つのシナリオを出力する際にいくつものシナリオ(json)が関わってくるため、読み込まれる順序を理解する必要がある。

1. 最も優先度が高いのは _boilerplate.json_ に定義されているシナリオ。
2. 次に _boilerplate.json_ に定義されているシナリオのサブシナリオ。
3. 次が _common.json_
4. 最後に _common.js_ の中で定義されているサブシナリオ。
  
_$subscenarios_ 配列は先頭から積み上げていくので配列に複数のシナリオが含まれる場合、前方より後方が優先される。

#### <span id="toc3-5">3-5. カスタムプレフィックス</span>

再利用時に記述内容に重複があった場合、具体的にどの様にデータに作用するのか。そしてどの様な操作オプションがあるのか。

シナリオを上書きしたいと思った場合、数値や文字列などのプリミティブ型であれば代入以外の選択肢は無いが、配列には二通りの上書きが存在する。一つはプリミティブ同様に単純な上書き、もう一つは既存の配列に対するマージ。
  
他方、特定のシナリオを実行する場合にのみ、再利用しているシナリオの一部操作を除外したいという特殊なケースもある。boilerplate ではカスタムプレフィックスを利用してそれらの意図を柔軟に制御できるようになっている。

| prefix | description |
|:----:|----|
| +: | 対象配列にマージする。配列内で重複が見つかった場合、後方の値を破棄する |
| -: | 対象配列に含まれる同じ値を取り除く |
| =: | 配列全体を入れ替える |

オブジェクトやプリミティブな値を保持するキーにカスタムプレフィックスを指定しても意味はない。
配列を保持するキーにカスタムプレフィックスの指定が無い場合、 `+:` として扱われる。

#### <span id="toc3-6">3-6. カスタムプレフィックスの適用順序</span>

同一シナリオファイル内に異なるカスタムプレフィックスを持つ同名のキーが存在する場合、処理優先度は`-:` < `+:` < `=:` となる。（つまり `=:` が定義されている場合は、`-:` や `+:` は無視されるし、`-:` と `+:` が定義されている場合は、`-:` が先に処理される。）異なるシナリオ間でカスタムプレフィクスを持つ同名のキーが存在する場合、[「シナリオの適用順序」](#toc3-4) に従って出力内容が決まる。

__例__
  
上書き先
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

既存の backstopjs でも onBefore, onReady を活用したユーザー定義の engine_script に対するモジュール化は実現されているが、そこには明確なルールがないためそれらの呼び出しに関する設計と実装に時間を取られてしまう。boilerplate では規則を設けることでその負担を減らし、ヘッドレスブラウザに対するコーディングに集中できるようにしている。実装したコードはシナリオからプラガブルに編集できる。
  
#### <span id="toc4-1">4-1. 拡張操作の実装</span>

boilerplate における engine_scripts のエントリーポイントは onBefore, onReady ではなく、`init` コマンドで生成された _\${engine}\_scripts.js_ となる。 _${engine}_ はテストに使用しているエンジンの名前となる。（デフォルトではpuppeteer）
onBefore, onReady は `init` コマンド実行時にシナリオから制御するためのフック関数へ書き換えられる。

※その他のエンジンについての切り分けも考えて作っているが、自分自身が puppeteer 以外のエンジンを利用していないので他のエンジンは現状ではサポートしていない。

[_\${engine}\_scripts.js_](https://github.com/coremind-jp/backstopjs_boilerplate/blob/master/boilerplate/templates/engine_scripts.js) を見ると分かるが、このモジュール関数は _preimplements_ 引数が渡されている。このオブジェクトの中には backstopjs が提供する _clickAndHoverHelper_ , _loadCookies_ , _overrideCSS_ の実装が含まれる。（_ignoreCSP_ , _interceptImages_ については追加のパッケージが必要なので含めていない） もしこれらの実行タイミングを制御したいのであればこのオブジェクトから取り出して任意のタイミングで呼び出すことができる。

再利用を意識した単位で記述すれば1ファイルでも十分だと思うが、気になる場合は _preimplements_ と同様に意味ある塊ごとに外部ファイル化し、後からこのファイルのモジュールに組み込む。

__例__

実装例
```js
./backstop_data/boilerplate/puppeteer_scripts.js
module.exports = preimplements => ({
  ...preimplements,
  
  // bodyに設定されているheightスタイルをautoに書き換える
  overwriteBodyHeight: async function(page) {
    await page.addStyleTag({ content: `body { height: auto !important; }` });
  },

  // 指定秒数待機する
  wait: async function(page, scenario, vp, isReference, engine, config, delay) {
    await page.waitFor(ms);
  },
});
```

#### <span id="toc4-2">4-2. 拡張操作の呼び出し</span>

シナリオ内から拡張操作を呼び出すには、 _$scripts_ 配列に関数名を記述する。呼び出しタイミング（onBefore, onReady）を制御するためにカスタムプレフィックスを利用する。また関数名の後に `:` で区切った値を加えるとその値を引数として関数へ渡すことができる。（実装例では _wait_ 関数の _ms_ 引数がそれを利用している）

実行順序に関しては、_before_ プレフィックスが付いているものは、_ready_ プレフィックスが付いているものよりも必ず先に呼ばれる。同じプレフィックス同士の優先順位は配列への追加順となる。

| prefix | description |
|:----:|----|
| before: | 指定した関数をonBefore時に呼び出す |
| ready: | 指定した関数をonReady時に呼び出す |

__例__

シナリオ
```json
./backstop_data/boilerplate/index/scenario_a.json
{
  "all": {
    "$subscenarios": [
      "sheared_scenario"
    ],
    "$scripts": [
+       "before:wait:1000",
    ],
  },
  "tablet": {
    "$subscenarios": [
      "sheared_scenario",
      "sheared_scenario_only_tablet"
    ],
    "$scripts": [
+     "ready:overwriteBodyHeight"
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
