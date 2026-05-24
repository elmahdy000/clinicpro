import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.billingService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.billingService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
    return this.billingService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.remove(id);
  }
}
