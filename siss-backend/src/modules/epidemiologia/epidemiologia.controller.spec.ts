import { Test, TestingModule } from '@nestjs/testing';
import { EpidemiologiaController } from './epidemiologia.controller';

describe('EpidemiologiaController', () => {
  let controller: EpidemiologiaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpidemiologiaController],
    }).compile();

    controller = module.get<EpidemiologiaController>(EpidemiologiaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
