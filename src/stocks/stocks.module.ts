import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock } from './stocks.entity';

@Module({
  // 이 모듈에서 TypeORM을 사용하기 위해, 'Stock' 엔티티에 해당하는 Repository를 주입(Inject)할 수 있도록 설정
  imports: [TypeOrmModule.forFeature([Stock])],
  // 이 모듈의 API 엔드포인트를 담당할 컨트롤러를 등록
  controllers: [StocksController],
  // 이 모듈의 비즈니스 로직을 담당할 서비스를 등록
  providers: [StocksService],
})
// StocksModule 클래스를 내보낸다.
export class StocksModule {}
