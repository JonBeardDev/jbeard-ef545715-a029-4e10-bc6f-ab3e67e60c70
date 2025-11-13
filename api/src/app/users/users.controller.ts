import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { CreateUserDto, UpdateUserDto, IRequestUser } from '@workspace/data';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { CurrentUser, MinRoleLevel } from '@workspace/auth';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class UsersController {
    constructor(private usersService: UsersService) {}
  
    @Post()
    @MinRoleLevel(2) // Only Admin and Owner can create users
    create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: IRequestUser) {
      return this.usersService.create(createUserDto, user);
    }
  
    @Get()
    findAll(@CurrentUser() user: IRequestUser) {
      return this.usersService.findAll(user);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: IRequestUser) {
      return this.usersService.findOne(id, user);
    }
  
    @Put(':id')
    @MinRoleLevel(2) // Only Admin and Owner can update users
    update(
      @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto,
      @CurrentUser() user: IRequestUser
    ) {
      return this.usersService.update(id, updateUserDto, user);
    }
  
    @Delete(':id')
    @MinRoleLevel(2) // Only Admin and Owner can delete users
    remove(@Param('id') id: string, @CurrentUser() user: IRequestUser) {
      return this.usersService.remove(id, user);
    }
  }