import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './stocks.entity';
import { RedisService } from 'src/redis/redis.service';

// @Injectable() 데코레이터로 이 클래스를 NestJS의 DI 시스템에 등록
@Injectable()
export class StocksService {
  // 생성자(constructor)를 통해 의존성을 주입(DI)받는다
  constructor(
    // @InjectRepository(Stock) 데코레이터로 Stock 엔티티의 Repository를 주입받는다.
    // 이 'stocksRepository'를 통해 DB(SQLite)와 통신한다.
    @InjectRepository(Stock)
    private readonly stocksRepository: Repository<Stock>,
    private readonly redisService: RedisService, // 전역 Redis 인스턴스 주입
  ) {}

  private getCacheKey(ticker: string) {
    return `stock:${ticker}`;
  }

  // 앱 실행 시 자동으로 실행되는 생명주기 매서드
  async onModuleInit() {
    // [Seeding] 앱 실행 시 더미 데이터를 삽입하는 로직
    console.log('[Seeding] Checking if dummy data is needed...');

    // DB에 이미 데이터가 있는지 확인합니다. (0개인지)
    const count = await this.stocksRepository.count();

    // DB가 비어있을 때(count === 0)만 더미 데이터를 삽입합니다.
    if (count === 0) {
      console.log('[Seeding] No data found. Inserting dummy stocks...');

      // 1. 더미 데이터 객체 생성
      const dummyAAPL = this.stocksRepository.create({
        ticker: 'AAPL',
        price: 150.0,
      });

      const dummyMSFT = this.stocksRepository.create({
        ticker: 'MSFT',
        price: 300.0,
      });

      // 2. DB에 배열로 한 번에 저장합니다.
      await this.stocksRepository.save([dummyAAPL, dummyMSFT]);

      console.log('[Seeding] Dummy data insertion complete.');
    } else {
      console.log(
        '[Seeding] Database already contains data. Skipping seeding.',
      );
    }
  }

  // 의도적인 지연을 위한 매서드
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // [FR-002] Cache-Aside 읽기 패턴을 구현하는 메서드
  async getStock(ticker: string): Promise<Stock | null> {
    console.log(`[service]getStock. ticker:${ticker}`);

    // Redis 캐시 조회
    const cacheKey = this.getCacheKey(ticker);
    const cachedStock = await this.redisService.get<Stock>(cacheKey);
    console.log('[service]check cache key : ', cacheKey);
    console.log('[service]check cache stock : ', cachedStock);

    if (cachedStock) {
      console.log(`✅ Cache Hit! Data from Redis.`);
      return cachedStock;
    }

    // 캐시에 데이터가 없으면 db 조회
    // 느린 DB 조회 시뮬레이션을 위해 2초간 강제 대기
    await this.sleep(2000);
    const stock = await this.stocksRepository.findOneBy({ ticker });
    console.log('[service]getStocks from db. stocks : ', stock);

    if (stock) {
      await this.redisService.set(cacheKey, { ...stock }, 60 * 1000);
      console.log('[service]save stock to cache');
      return stock;
    } else {
      return null;
    }
  }

  // [FR-001] "직접 덮어쓰기" 쓰기 패턴을 구현하는 메서드
  async updateStock(ticker: string, price: number): Promise<Stock | null> {
    const stock = await this.stocksRepository.findOneBy({ ticker });
    if (!stock) return null;

    stock.price = price;

    const updatedStock = await this.stocksRepository.save(stock);
    await this.redisService.set(
      this.getCacheKey(ticker),
      { ...updatedStock },
      60 * 1000,
    ); // cache 업데이트
    return updatedStock;
  }
}
