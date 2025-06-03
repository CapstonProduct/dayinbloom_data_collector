# Dayinbloom Data Collector

데이터 수집 및 삭제를 담당하는 Lambda 함수, 그리고 Event 설정들을 모아놓은 레포입니다.

디렉토리 구조는 다음 예시와 같은 형식으로 구성되어 있습니다:

- `handler.ts`: 핸들러
- `models`: 해당 핸들러에서 사용하는 데이터베이스 모델
- `utils`: 해당 핸들러에서 사용하는 유틸리티 함수

```
src/daily-health-metrics-collector
├── handler.ts
├── models
│   ├── fitbit_health_metrics.ts
│   ├── index.ts
│   └── users.ts
└── utils
    └── authentication.ts
```

## Build and Deploy

### Build

빌드를 위한 스크립트를 구성하였으며 다음과 같이 실행하면 됩니다.

```bash
chmod 777 build.sh
./build.sh
```

전체 빌드 프로세스는 다음과 같습니다:

```shell
# 1. 기존 build artifacts 제거
rm -rf dist
# 2. Typescript 컴파일
tsc
# 3. Javascript 포맷팅
prettier dist/* --write
# 4. SAM 템플릿 검증하기
sam validate
# 5. 빌드하기
sam build
```

### Deploy

만약 step-by-step 가이드를 원한다면 `--guided` 옵션을 뒤에 붙이세요.  
만약 aws credentials(보통 `~/.aws/credentials` 에 위치함) 의 프로필명이 다르다면 `--aws-profile <YOUR_PROFILE_NAME>` 옵션을 뒤에 붙여 사용하세요

```bash
sam deploy
```

배포가 완료되면 환경 변수를 함수에 삽입해야 합니다. 이 또한 스크립트가 이미 구성되어 있습니다:

```bash
node scripts/addLambdaVars.js
```

환경변수는 `.env` 파일에 보관되어야 하며 저자에게 문의하세요.

## Local Development

```bash
git clone https://github.com/CapstonProduct/dayinbloom-data-collector
cd dayinbloom-data-collector
npm install
```

### 함수 로컬 테스트

`env/locals.json` 은 `.env` 파일의 key/value 를 JSON 형식으로 변환하여 사용하세요

```bash
sam local invoke DailyHealthMetricsCollector --event events/collect-daily-health-metrics.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit
sam local invoke DailySummaryCollector --event events/collect-daily-summary.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit
sam local invoke IntradayDataCollector --event events/collect-intraday-data.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit
sam local invoke SleepDataCollector --event events/collect-sleep-data.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit

sam local invoke ShortTermAverageCalculator --event events/calculate-short-term-average.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit
sam local invoke LongTermAverageCalculator --event events/calculate-long-term-average.json --env-vars env/locals.json --profile dayinbloom --no-memory-limit
```
