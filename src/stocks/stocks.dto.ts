import { IsNumber, IsPositive } from 'class-validator';

// POST /stocks/:ticker 요청의 Body로 사용될 DTO 클래스
export class UpdateStockDto {
  @IsNumber() // @IsNumber(): 이 값이 숫자인지 검증
  @IsPositive() // @IsPositive(): 이 값이 0보다 큰 양수인지 검증
  // price 프로퍼티 (타입: 숫자)
  price: number;
}
