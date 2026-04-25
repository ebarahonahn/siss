import { Test, TestingModule } from '@nestjs/testing';
import { EpidemiologiaService } from './epidemiologia.service';

describe('EpidemiologiaService', () => {
  let service: EpidemiologiaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpidemiologiaService],
    }).compile();

    service = module.get<EpidemiologiaService>(EpidemiologiaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
