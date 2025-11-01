import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// 이 클래스가 'stocks'라는 이름의 테이블과 매핑되는 엔티티임을 선언
@Entity('stocks')
// Stock 클래스를 내보냅니다.
export class Stock {
  // 'id' 컬럼을 자동 증가하는 기본 키(Primary Key)로 설정
  @PrimaryGeneratedColumn()
  // id 프로퍼티 (타입: 숫자)
  id: number;

  // 'ticker' 컬럼을 정의
  @Column({
    // 'ticker' 값은 고유해야 함을 설정 (e.g., 'AAPL' 중복 불가)
    unique: true,
  })
  // ticker 프로퍼티 (타입: 문자열)
  ticker: string;

  // 'price' 컬럼을 정의(소수점을 다루기 위해 'decimal' 타입 사용)
  @Column('decimal')
  // price 프로퍼티 (타입: 숫자)
  price: number;

  // 'updatedAt' 컬럼을 정의
  // 이 데코레이터는 엔티티가 저장(save/update)될 때마다 현재 시각으로 자동 업데이트한다.
  @UpdateDateColumn()
  // updatedAt 프로퍼티 (타입: Date)
  updatedAt: Date;
}
