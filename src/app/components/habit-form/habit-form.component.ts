import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { Habit, HabitType, HabitFrequency, CreateHabitDTO, UpdateHabitDTO } from '../../core/models/habit.model';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatRadioModule
  ],
  templateUrl: './habit-form.component.html',
  styleUrls: ['./habit-form.component.css']
})
export class HabitFormComponent implements OnInit {
  @Input() habitToEdit: Habit | null = null;
  @Output() formSubmit = new EventEmitter<CreateHabitDTO | UpdateHabitDTO>();
  @Output() closeSidenav = new EventEmitter<void>();
  
  habitForm!: FormGroup;
  habitTypes = Object.values(HabitType);
  habitFrequencies = Object.values(HabitFrequency);
  
  // Mapeo para mostrar nombres amigables
  typeLabels: { [key: string]: string } = {
    [HabitType.COUNTER]: 'Contador',
    [HabitType.QUIT]: 'Dejar algo'
  };
  
  frequencyLabels: { [key: string]: string } = {
    [HabitFrequency.DAILY]: 'Diaria',
    [HabitFrequency.WEEKLY]: 'Semanal',
    [HabitFrequency.MONTHLY]: 'Mensual'
  };
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initForm();
    
    // Si hay un hábito para editar, rellenar el formulario
    if (this.habitToEdit) {
      this.populateForm();
    }
    
    // Suscribirse a cambios en el tipo de hábito para mostrar/ocultar campos
    this.habitForm.get('type')?.valueChanges.subscribe(type => {
      this.updateFormBasedOnType(type);
    });
    
    // Suscribirse a cambios en hasTarget para mostrar/ocultar campo de objetivo
    this.habitForm.get('hasTarget')?.valueChanges.subscribe(hasTarget => {
      this.updateTargetField(hasTarget);
    });
  }
  
  initForm(): void {
    this.habitForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(21)]],
      type: [HabitType.COUNTER, Validators.required],
      frequency: [HabitFrequency.DAILY],
      hasTarget: [true],
      targetCount: [1, [Validators.min(1), Validators.required]],
      startDate: [new Date()]
    });
    
    // Configuración inicial basada en el tipo seleccionado
    this.updateFormBasedOnType(this.habitForm.get('type')?.value);
  }
  
  populateForm(): void {
    if (!this.habitToEdit) return;
    
    // Usar un valor por defecto para startDate si es undefined
    const startDate = this.habitToEdit.startDate ? new Date(this.habitToEdit.startDate) : new Date();
    
    this.habitForm.patchValue({
      name: this.habitToEdit.name,
      type: this.habitToEdit.type,
      frequency: this.habitToEdit.frequency || HabitFrequency.DAILY,
      hasTarget: this.habitToEdit.hasTarget,
      targetCount: this.habitToEdit.targetCount || 1,
      startDate: startDate
    });
    
    // Actualizar campos basados en el tipo
    this.updateFormBasedOnType(this.habitToEdit.type);
    
    // Si es edición, no permitir cambiar el tipo
    this.habitForm.get('type')?.disable();
  }
  
  updateFormBasedOnType(type: HabitType): void {
    if (type === HabitType.COUNTER) {
      this.habitForm.get('frequency')?.enable();
      this.habitForm.get('hasTarget')?.enable();
      this.updateTargetField(this.habitForm.get('hasTarget')?.value);
    } else {
      // Para tipo QUIT, deshabilitar campos no aplicables
      this.habitForm.get('frequency')?.disable();
      this.habitForm.get('hasTarget')?.disable();
      this.habitForm.get('targetCount')?.disable();
    }
  }
  
  updateTargetField(hasTarget: boolean): void {
    if (this.habitForm.get('type')?.value === HabitType.COUNTER) {
      if (hasTarget) {
        this.habitForm.get('targetCount')?.enable();
      } else {
        this.habitForm.get('targetCount')?.disable();
      }
    }
  }
  
  onSubmit(): void {
    if (this.habitForm.invalid) {
      this.habitForm.markAllAsTouched();
      return;
    }
    
    const formValues = this.habitForm.getRawValue(); // Incluye valores deshabilitados
    
    if (this.habitToEdit) {
      // Actualizar hábito existente
      const updateData: UpdateHabitDTO = {
        id: this.habitToEdit.id,
        name: formValues.name,
        frequency: formValues.type === HabitType.COUNTER ? formValues.frequency : undefined,
        hasTarget: formValues.type === HabitType.COUNTER ? formValues.hasTarget : false,
        targetCount: formValues.type === HabitType.COUNTER && formValues.hasTarget ? formValues.targetCount : undefined
      };
      
      this.formSubmit.emit(updateData);
    } else {
      // Crear nuevo hábito
      const createData: CreateHabitDTO = {
        name: formValues.name,
        type: formValues.type,
        frequency: formValues.type === HabitType.COUNTER ? formValues.frequency : undefined,
        hasTarget: formValues.type === HabitType.COUNTER ? formValues.hasTarget : false,
        targetCount: formValues.type === HabitType.COUNTER && formValues.hasTarget ? formValues.targetCount : undefined,
        startDate: formValues.startDate.toISOString()
      };
      
      this.formSubmit.emit(createData);
    }
  }
  
  onCancel(): void {
    this.closeSidenav.emit();
  }
  
  // Getters para acceder fácilmente a los valores del formulario
  get isEditMode(): boolean {
    return !!this.habitToEdit;
  }
  
  get formTitle(): string {
    return this.isEditMode ? 'Editar hábito' : 'Crear hábito';
  }
  
  get submitButtonText(): string {
    return this.isEditMode ? 'Guardar cambios' : 'Crear hábito';
  }
  
  get isCounterType(): boolean {
    return this.habitForm.get('type')?.value === HabitType.COUNTER;
  }
  
  get hasTargetEnabled(): boolean {
    return this.habitForm.get('hasTarget')?.value && this.isCounterType;
  }
}
