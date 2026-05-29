import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe,
  UseGuards, Query, Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/user-role.enum';
import { CreateStockDto } from './dto/create-stock.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { RemoveStockDto } from './dto/remove-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetInventoryQueryDto } from './dto/get-inventory-query.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get()
  findAll(@Query() query: GetInventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get('low-stock')
  getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get('expiring')
  getExpiring(@Query('days') days?: string) {
    return this.inventoryService.getExpiringSoon(days ? parseInt(days, 10) : 30);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Post()
  create(@Body() dto: CreateStockDto) {
    return this.inventoryService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Put(':id/add-stock')
  addStock(@Param('id', ParseIntPipe) id: number, @Body() dto: AddStockDto, @Req() req: any) {
    return this.inventoryService.addStock(id, dto.quantity, dto.notes, req.user?.id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST)
  @Put(':id/remove-stock')
  removeStock(@Param('id', ParseIntPipe) id: number, @Body() dto: RemoveStockDto, @Req() req: any) {
    return this.inventoryService.removeStock(id, dto.quantity, dto.referenceType, dto.referenceId, req.user?.id, dto.notes);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Put(':id/adjust')
  adjustStock(@Param('id', ParseIntPipe) id: number, @Body() dto: AdjustStockDto, @Req() req: any) {
    return this.inventoryService.adjustStock(id, dto.quantity, dto.notes, req.user?.id);
  }

  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.remove(id);
  }
}