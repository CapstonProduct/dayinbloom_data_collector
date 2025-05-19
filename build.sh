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
