import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { StocksModule } from './stocks/stocks.module';

import { Stock } from './stocks/stocks.entity';
import { ConfigModule } from '@nestjs/config'; // NestJS 설정 모듈
import { RedisConfigService } from './config/redis.config';

@Module({
  imports: [
    // ConfigModule을 전역(isGlobal)으로 설정하여,
    // 다른 모듈(e.g., TypeORM, Cache)에서 환경변수를 바로 사용할 수 있게 합니다.
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM 모듈을 설정합니다.
    TypeOrmModule.forRoot({
      type: 'sqlite',
      // 'db.sqlite'라는 파일명으로 데이터베이스를 생성
      database: 'db.sqlite',
      // TypeORM이 인식할 엔티티(테이블) 클래스들을 배열로 지정
      entities: [Stock],
      // [개발용] 애플리케이션 실행 시 엔티티 정의에 맞춰 DB 스키마를 자동으로 생성/변경
      synchronize: true,
    }),

    // 캐시 모듈을 설정합니다.
    CacheModule.register({
      // isGlobal: true로 설정하여, StocksModule 등 다른 모듈에서
      // 별도 import 없이 `CACHE_MANAGER`를 바로 주입(Inject)받을 수 있게 한다
      useClass: RedisConfigService,
      isGlobal: true,
    }),

    StocksModule,
  ],

  // App 모듈은 별도의 컨트롤러, 서비스가 없음
  controllers: [],
  providers: [],
})
export class AppModule {}
