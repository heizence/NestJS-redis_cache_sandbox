import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UsePipes, // DTO 유효성 검사를 위해 필요
  ValidationPipe, // DTO 유효성 검사 파이프
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { UpdateStockDto } from './stocks.dto';

// 이 컨트롤러의 기본 경로를 '/stocks'로 설정
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get(':ticker')
  async getStockByTicker(@Param('ticker') ticker: string) {
    console.log(`[Controller] GET /stocks/${ticker} 요청 수신`);
    const stock = await this.stocksService.getStock(ticker);
    return stock;
  }

  @Post(':ticker')
  // 이 엔드포인트에 ValidationPipe를 적용하여 Body(DTO)를 자동으로 검증
  @UsePipes(new ValidationPipe())
  async updateStock(
    @Param('ticker') ticker: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    console.log(
      `[Controller] POST /stocks/${ticker} 요청 수신 (Price: ${updateStockDto.price})`,
    );

    const updatedStock = await this.stocksService.updateStock(
      ticker,
      updateStockDto.price,
    );
    return updatedStock;
  }
}
