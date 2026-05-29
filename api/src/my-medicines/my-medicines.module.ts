import { Module } from '@nestjs/common';
import { MyMedicinesService } from './my-medicines.service';
import { MyMedicinesController } from './my-medicines.controller';

@Module({
  controllers: [MyMedicinesController],
  providers: [MyMedicinesService],
})
export class MyMedicinesModule {}
