// NestJS 테스팅 모듈과 의존성들을 가져옵니다.
import { Test, TestingModule } from '@nestjs/testing';
import { StocksService } from './stocks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock } from './stocks.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';

// 'Stock' 엔티티의 TypeORM Repository를 모의(Mock) 객체로 만들기 위한 타입 정의
// Repository의 모든 메서드를 jest.fn() (모의 함수)으로 만듭니다.

type MockRepository = {
  findOneBy: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  insert: jest.Mock;
};

// 'Cache' 객체를 모의(Mock) 객체로 만들기 위한 타입 정의
type MockCache = {
  get: jest.Mock;
  set: jest.Mock;
};

// 테스트 스위트(Test Suite)를 정의합니다. 대상은 'StocksService'입니다.
describe('StocksService', () => {
  // 테스트에서 사용할 변수들을 선언합니다.
  let service: StocksService; // 테스트 대상인 StocksService
  let stockRepository: MockRepository; // 모의(Mock) DB Repository
  let cacheManager: MockCache; // 모의(Mock) Cache Manager

  // 각 테스트(it)가 실행되기 '전(beforeEach)'에 매번 실행되는 설정 블록입니다.
  beforeEach(async () => {
    // 가짜(모의) Repository 객체를 생성합니다.
    const mockRepository = {
      // 'findOne' 메서드를 Jest 모의 함수로 만듭니다.
      findOneBy: jest.fn(),
      // (Seeding 테스트를 위해) 'count' 메서드를 모의 함수로 만듭니다.
      count: jest.fn(),
      // (Seeding 테스트를 위해) 'create' 메서드를 모의 함수로 만듭니다.
      create: jest.fn(),
      // (Seeding 테스트를 위해) 'save' 메서드를 모의 함수로 만듭니다.
      save: jest.fn(),
      // (updateStock 테스트를 위해) 'upsert' 메서드를 모의 함수로 만듭니다.
      upsert: jest.fn(),
    };

    // 가짜(모의) Cache 객체를 생성합니다.
    const mockCache = {
      // 'get' 메서드를 Jest 모의 함수로 만듭니다.
      get: jest.fn(),
      // 'set' 메서드를 Jest 모의 함수로 만듭니다.
      set: jest.fn(),
    };

    // NestJS의 테스트용 모듈을 생성합니다.
    // 이는 AppModule과 유사하지만, 실제 DB/Redis 연결 대신 모의 객체를 주입합니다.
    const module: TestingModule = await Test.createTestingModule({
      // 테스트할 서비스(StocksService)를 providers에 등록합니다.
      providers: [
        StocksService,
        {
          // TypeORM의 Repository 토큰('StockRepository')을
          useValue: mockRepository, // 우리가 만든 모의 객체(mockRepository)로 대체합니다.
          provide: getRepositoryToken(Stock),
        },
        {
          // 캐시 매니저 토큰('CACHE_MANAGER')을
          useValue: mockCache, // 우리가 만든 모의 객체(mockCache)로 대체합니다.
          provide: CACHE_MANAGER,
        },
      ],
    }).compile(); // 모듈을 컴파일합니다.

    // 컴파일된 모듈에서 StocksService의 인스턴스를 가져옵니다.
    // (이 서비스에는 가짜 Repository와 가짜 Cache가 주입된 상태입니다)
    service = module.get<StocksService>(StocksService);
    // 테스트에서 사용할 수 있도록 모의 객체들을 변수에 할당합니다.
    stockRepository = module.get(getRepositoryToken(Stock));
    cacheManager = module.get(CACHE_MANAGER);
  });

  // [테스트 1: Cache Miss] 캐시에 데이터가 없고 DB에 데이터가 있는 경우
  it('[Cache Miss] should fetch from DB and set cache if cache is empty', async () => {
    // 1. Given (준비)
    // 테스트용 더미 데이터
    const mockStock = {
      id: 1,
      ticker: 'AAPL',
      price: 150,
      updatedAt: new Date(),
    };
    const ticker = 'AAPL';
    const cacheKey = `stock:${ticker}`;

    // cacheManager.get()이 호출되면 'null' (캐시 없음)을 반환하도록 설정
    cacheManager.get.mockResolvedValue(null);
    // stocksRepository.findOne()이 호출되면 'mockStock' (DB 데이터)을 반환하도록 설정
    stockRepository.findOneBy.mockResolvedValue(mockStock);

    // 2. When (실행)
    // 서비스의 getStock 메서드를 호출합니다.
    const result = await service.getStock(ticker);

    // 3. Then (검증)
    // 결과가 DB 데이터(mockStock)와 동일한지 확인
    expect(result).toEqual(mockStock);

    // cacheManager.get()이 정확히 1번 호출되었는지 확인
    expect(cacheManager.get).toHaveBeenCalledTimes(1);
    // cacheManager.get()이 올바른 키(cacheKey)로 호출되었는지 확인
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);

    // [핵심] cache miss가 발생했으므로 DB(Repository)를 조회해야 합니다.
    expect(stockRepository.findOneBy).toHaveBeenCalledTimes(1);

    // [핵심] DB에서 가져온 데이터를 캐시에 저장해야 합니다.
    expect(cacheManager.set).toHaveBeenCalledTimes(1);
    // 캐시에 저장할 때 올바른 인수(키, 값, TTL)로 호출되었는지 확인
    expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockStock, 60);
  });

  // [테스트 2: Cache Hit] 캐시에 데이터가 있는 경우
  it('[Cache Hit] should fetch from cache and NOT call DB if cache is valid', async () => {
    // 1. Given (준비)
    // 캐시에 저장되어 있을 더미 데이터
    const mockStock = {
      id: 1,
      ticker: 'AAPL',
      price: 150,
      updatedAt: new Date(),
    };
    const ticker = 'AAPL';
    const cacheKey = `stock:${ticker}`;

    // cacheManager.get()이 호출되면 'mockStock' (캐시 있음)을 반환하도록 설정
    cacheManager.get.mockResolvedValue(mockStock);

    // 2. When (실행)
    // 서비스의 getStock 메서드를 호출합니다.
    const result = await service.getStock(ticker);

    // 3. Then (검증)
    // 결과가 캐시 데이터(mockStock)와 동일한지 확인
    expect(result).toEqual(mockStock);

    // cacheManager.get()이 정확히 1번 호출되었는지 확인
    expect(cacheManager.get).toHaveBeenCalledTimes(1);
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);

    // [핵심] cache hit이 발생했으므로 DB(Repository)는 절대 호출되면 안 됩니다.
    expect(stockRepository.findOneBy).not.toHaveBeenCalled();

    // [핵심] cache hit이 발생했으므로 캐시에 새로 저장할 필요가 없습니다.
    expect(cacheManager.set).not.toHaveBeenCalled();
  });
});
