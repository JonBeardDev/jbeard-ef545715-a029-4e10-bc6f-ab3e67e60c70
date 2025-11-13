import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { TasksService } from './tasks.service';
  import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, IRequestUser } from '@workspace/data';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { CurrentUser } from '@workspace/auth';
  
  @Controller('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class TasksController {
    constructor(private tasksService: TasksService) {}
  
    @Post()
    create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: IRequestUser) {
      return this.tasksService.create(createTaskDto, user);
    }
  
    @Get()
    findAll(@CurrentUser() user: IRequestUser, @Query() filters: TaskFilterDto) {
      return this.tasksService.findAll(user, filters);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() user: IRequestUser) {
      return this.tasksService.findOne(id, user);
    }
  
    @Put(':id')
    update(
      @Param('id') id: string,
      @Body() updateTaskDto: UpdateTaskDto,
      @CurrentUser() user: IRequestUser
    ) {
      return this.tasksService.update(id, updateTaskDto, user);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: IRequestUser) {
      return this.tasksService.remove(id, user);
    }
  }