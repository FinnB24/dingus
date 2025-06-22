import sys
import math
# import all the widgets
from PySide6.QtCore import Qt, QPointF, QPoint
from PySide6.QtGui import (QCloseEvent, QColor, QImage, QKeySequence, QMouseEvent, 
                          QPainter, QPen, QPixmap, QAction, QPolygonF)
from PySide6.QtWidgets import (QApplication, QColorDialog, QFileDialog, QLabel, QMainWindow, QMenuBar, 
                              QMessageBox, QSlider, QToolBar, QWidget, QPushButton, QDialog, 
                              QFormLayout, QDialogButtonBox, QLineEdit, QSpinBox, QMenu, QHBoxLayout, QWidgetAction)

###### Aufgabe 2a: Erweiterung für Shape-Beschreibung mit Dreiecken ######
from typing import List
######

###### Aufgabe 2b: Subdivision und Deformation Parameter und UI ######
SUBDIV_LEVEL = 0  # Default 0x Subdivision
DEFORM_ON = True  # Standard: Deformation an/aus
DEFORM_PARAMS = dict(a=20,  # Amplitude
                     b=1/200,  # Frequenz (Breite)
                     c=0)      # Phase
######


class MyPaintArea(QWidget):
    def __init__(self, parent: QWidget):
        super().__init__(parent)
        
        # mindest größe malbereich
        self.setMinimumWidth(640)
        self.setMinimumHeight(480)
        
        #Bildobjekt für Zeichenfläche aka weiß
        self.image: QImage = QImage(1080, 720, QImage.Format.Format_RGB32)
        self.image.fill(QColor(255, 255, 255))

        #default mouse 
        self.mouse_down: bool = False
        self.last_pos: tuple[int, int] = (0, 0)

        # stift
        self.pen_size: int = 2
        self.pen_color: QColor = QColor(0, 0, 0) #black

        # zoom default
        self.zoom: float = 1.0 # = 100%
        self.offset_x: float = 0.0 # Offset x
        self.offset_y: float = 0.0 # Offset y

        # aktuelles tool
        self.current_tool: str = "freehand"  # Andere Optionen: "rectangle", "circle", "star", "select", "check_point"
        self.start_pos: tuple[float, float] | None = None  #startpos für Formen
        self.scene = Scene()  #speichert alle gezeichneten formen
        
        # Shape properties
        self.shape_fill_color = QColor(255, 255, 255)  # Default white fill
        self.shape_border_color = QColor(0, 0, 0)  # Default black border
        self.shape_border_width = 1  # Default border width

        self.selected_shape = None
        self.drag_start_pos = None
        self.drag_mode = None  #move/scale
        self.scale_handle = None

        ###### Aufgabe 2b: UI für Subdivision & Deformation ######
        self.subdiv_level = SUBDIV_LEVEL
        self.deform_on = DEFORM_ON

        # Die UI-Elemente werden jetzt in die Toolbar integriert, nicht als Overlays im Widget!
        ######

    ###### Aufgabe 2b: UI-Callbacks ######
    def set_subdiv_level(self, value):
        self.subdiv_level = value
        self.update()
    def toggle_deform(self):
        self.deform_on = not self.deform_on
        # Button-Text wird in MainWindow aktualisiert, da Button dort lebt!
        self.update()
    ######

    #aktuelle Werkzeug
    def setTool(self, tool: str):
        self.current_tool = tool
        
    #updated pen col    
    def updatePenColor(self, color: QColor):
        self.pen_color = color
      
    # -//- pen size  
    def updatePenSize(self, size: int):
        self.pen_size = size

    def updateShapeFillColor(self, color: QColor):
        self.shape_fill_color = color
    def updateShapeBorderColor(self, color: QColor):
        self.shape_border_color = color
    def updateShapeBorderWidth(self, width: int):
        self.shape_border_width = width

    #draws paint area
    def paintEvent(self, event):
        painter: QPainter = QPainter(self) 
        painter.scale(self.zoom, self.zoom) # Skalierung des Malbereichs, Zoomfaktor wird berücksichtigt
        painter.translate(self.offset_x, self.offset_y) # Anschließende Verschiebung des Malbereichs
        painter.drawImage(0, 0, self.image) # Zeichne das Bild in den verschobenen Malbereich

        ###### Aufgabe 2b: Triangle-Rendering statt draw_all ######
        # 1. Alle Shapes als Dreiecksliste holen (mit Subdivision und Deformation)
        triangles = []
        for shape in self.scene.shapes:
            tris = shape.describe_shape()
            tris = subdivide_triangles(tris, self.subdiv_level)
            if self.deform_on:
                tris = deform_triangles(tris, DEFORM_PARAMS)
            triangles.extend(tris)
        draw_triangles(painter, triangles)
        # 2. Auswahlrahmen für selektierte Shapes weiterzeichnen
        for shape in self.scene.shapes:
            shape.draw_selection(painter)
        ######
        
    # verschiebt Ansicht
    def move_view(self, dx: float, dy: float):
        self.offset_x += dx # Verschiebung in X-Richtung
        self.offset_y += dy # Verschiebung in Y-Richtung
        self.update()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.mouse_down = True              # wenn LMB pressed
            x: int = event.position().x() 
            y: int = event.position().y()
            self.last_pos = (x, y)           #update mouse pos
            
            #conv screen coordinates to scene coordinates
            scene_x = x / self.zoom - self.offset_x
            scene_y = y / self.zoom - self.offset_y
            
            if self.current_tool == "select":
                #if clicking on handle of the selected shape
                selected_shape = self.scene.get_selected_shape()
                if selected_shape:
                    x_min, x_max, y_min, y_max = selected_shape.bounding_box()
                    handle_size = 5 / self.zoom  # Handle size in scene coordinates
                    
                    #Check each handle position
                    handles = {
                        'top-left': (x_min, y_min),
                        'left-middle': (x_min, (y_min + y_max)/2),
                        'bottom-left': (x_min, y_max),
                        'top-middle': ((x_min + x_max)/2, y_min),
                        'bottom-middle': ((x_min + x_max)/2, y_max),
                        'top-right': (x_max, y_min),
                        'right-middle': (x_max, (y_min + y_max)/2),
                        'bottom-right': (x_max, y_max)
                    }
                    
                    for handle_name, (hx, hy) in handles.items():
                        if (abs(scene_x - hx) < handle_size and abs(scene_y - hy) < handle_size):
                            self.drag_mode = 'scale'
                            self.scale_handle = handle_name
                            self.drag_start_pos = (scene_x, scene_y)
                            return
                    
                    # If not a handle, check if clcking inside the shape
                    if selected_shape.contains_point(scene_x, scene_y):
                        self.drag_mode = 'move'
                        self.drag_start_pos = (scene_x, scene_y)
                        return
                
                # If no handle/ shape clicked, try select a new shape
                self.scene.select_shape_at(scene_x, scene_y)
                self.update()
                return
            
            elif self.current_tool == "check_point":
                #check which shapes contain this point
                containing_shapes = []
                for shape in self.scene.shapes:
                    if shape.contains_point(scene_x, scene_y):
                        containing_shapes.append(shape)
                
                #msg
                if containing_shapes:
                    shape_list = "\n".join([f"- {type(shape).__name__}" for shape in containing_shapes])
                    message = f"The point is inside these shapes:\n{shape_list}"
                else:
                    message = "The point is not inside any shape"
                
                # Show msg
                QMessageBox.information(self, "Point Check", message)
            
            if self.current_tool in ("rectangle", "circle", "star"):
                self.start_pos = (x, y)



    def mouseReleaseEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.mouse_down = False

            end_x = event.position().x()
            end_y = event.position().y()
            
            # Rechteck draw
            if self.current_tool == "rectangle" and self.start_pos:
                x0 = min(self.start_pos[0], end_x) / self.zoom - self.offset_x # beachte offset
                y0 = min(self.start_pos[1], end_y) / self.zoom - self.offset_y
                width = abs(self.start_pos[0] - end_x) / self.zoom #beachte zoom
                height = abs(self.start_pos[1] - end_y) / self.zoom

                rect = Rectangle(x0, y0, width, height, self.shape_fill_color, self.shape_border_color, self.shape_border_width) #create &add
                self.scene.add_shape(rect)
                self.start_pos = None
                self.update()
            # circle
            elif self.current_tool == "circle" and self.start_pos:
                cx = (self.start_pos[0] + end_x) / 2 / self.zoom - self.offset_x #offst.
                cy = (self.start_pos[1] + end_y) / 2 / self.zoom - self.offset_y
                radius = max(abs(end_x - self.start_pos[0]), abs(end_y - self.start_pos[1])) / 2 / self.zoom #zoom

                circle = Circle(cx, cy, radius, self.shape_fill_color, self.shape_border_color, self.shape_border_width) #create &add
                self.scene.add_shape(circle)
                self.start_pos = None
                self.update()
            # star
            elif self.current_tool == "star" and self.start_pos:
                cx = (self.start_pos[0] + end_x) / 2 / self.zoom - self.offset_x
                cy = (self.start_pos[1] + end_y) / 2 / self.zoom - self.offset_y
                radius = max(abs(end_x - self.start_pos[0]), abs(end_y - self.start_pos[1])) / 2 / self.zoom
                # fix sternspitzenzahl (zB 5)
                points = 5
                star = Star(cx, cy, radius, points, self.shape_fill_color, self.shape_border_color, self.shape_border_width)
                self.scene.add_shape(star)
                self.start_pos = None
                self.update()
                
            elif self.current_tool == "select":
                self.drag_mode = None
                self.scale_handle = None
                self.drag_start_pos = None

    def mouseMoveEvent(self, event: QMouseEvent):
        if self.mouse_down and self.current_tool == "freehand":
            # aktuelle Mausposition
            x = event.position().x() 
            y = event.position().y() 

           # screen -> image coords; zoom/offset beachten
            x_img = x / self.zoom - self.offset_x 
            y_img = y / self.zoom - self.offset_y

            #line from last to current pos mit Zoom & offset
            last_x = self.last_pos[0] / self.zoom - self.offset_x 
            last_y = self.last_pos[1] / self.zoom - self.offset_y

            # draw ^ on image
            painter: QPainter = QPainter(self.image)
            pen: QPen = QPen(self.pen_color, self.pen_size)
            painter.setPen(pen)
            painter.drawLine(last_x, last_y, x_img, y_img)
            
            #update
            self.last_pos = (x, y)
            self.update()
            
        elif self.mouse_down and self.current_tool == "select" and self.drag_start_pos:
            current_x = event.position().x() / self.zoom - self.offset_x
            current_y = event.position().y() / self.zoom - self.offset_y
            dx = current_x - self.drag_start_pos[0]
            dy = current_y - self.drag_start_pos[1]
            
            selected_shape = self.scene.get_selected_shape()
            if selected_shape:
                if self.drag_mode == 'move':
                    selected_shape.move(dx, dy)
                elif self.drag_mode == 'scale':
                    #calc scaling factors based on which handle is being dragged
                    x_min, x_max, y_min, y_max = selected_shape.bounding_box()
                    width = x_max - x_min
                    height = y_max - y_min
                    
                    # calc scaling factors for each handle
                    if self.scale_handle == 'top-left':
                        factor_x = (width - dx) / width if width != 0 else 1
                        factor_y = (height - dy) / height if height != 0 else 1
                        selected_shape.scale(factor_x, factor_y)
                        selected_shape.move(dx, dy)
                    elif self.scale_handle == 'top-right':
                        factor_x = (width + dx) / width if width != 0 else 1
                        factor_y = (height - dy) / height if height != 0 else 1
                        selected_shape.scale(factor_x, factor_y)
                        selected_shape.move(0, dy)
                    elif self.scale_handle == 'bottom-left':
                        factor_x = (width - dx) / width if width != 0 else 1
                        factor_y = (height + dy) / height if height != 0 else 1
                        selected_shape.scale(factor_x, factor_y)
                        selected_shape.move(dx, 0)
                    elif self.scale_handle == 'bottom-right':
                        factor_x = (width + dx) / width if width != 0 else 1
                        factor_y = (height + dy) / height if height != 0 else 1
                        selected_shape.scale(factor_x, factor_y)
                    elif self.scale_handle == 'left-middle':
                        factor_x = (width - dx) / width if width != 0 else 1
                        selected_shape.scale(factor_x, 1)
                        selected_shape.move(dx, 0)
                    elif self.scale_handle == 'right-middle':
                        factor_x = (width + dx) / width if width != 0 else 1
                        selected_shape.scale(factor_x, 1)
                    elif self.scale_handle == 'top-middle':
                        factor_y = (height - dy) / height if height != 0 else 1
                        selected_shape.scale(1, factor_y)
                        selected_shape.move(0, dy)
                    elif self.scale_handle == 'bottom-middle':
                        factor_y = (height + dy) / height if height != 0 else 1
                        selected_shape.scale(1, factor_y)
                
                self.drag_start_pos = (current_x, current_y)
                self.update()

# properties dialog
class ShapePropertiesDialog(QDialog):
    def __init__(self, fill_color: QColor, border_color: QColor, border_width: int, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Shape Properties")
        
        # Fill color button
        self.fill_color_btn = QPushButton()
        self.fill_color_btn.setStyleSheet(f"background-color: {fill_color.name()}")
        self.fill_color_btn.clicked.connect(self.choose_fill_color)
        
        # Border color button
        self.border_color_btn = QPushButton()
        self.border_color_btn.setStyleSheet(f"background-color: {border_color.name()}")
        self.border_color_btn.clicked.connect(self.choose_border_color)
        
        #border width slider
        self.border_width_slider = QSlider(Qt.Orientation.Horizontal)
        self.border_width_slider.setRange(1, 10)
        self.border_width_slider.setValue(border_width)
        self.border_width_label = QLabel(f"Border Width: {border_width}")
        
        #llayout
        form = QFormLayout()
        form.addRow("Fill Color", self.fill_color_btn)
        form.addRow("Border Color", self.border_color_btn)
        form.addRow(self.border_width_label, self.border_width_slider)
        
        # OK/Cancel
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        form.addRow(buttons)
        
        self.setLayout(form)
        
        #Store colors
        self.fill_color = fill_color
        self.border_color = border_color
        self.border_width = border_width
        
        #Connect slider
        self.border_width_slider.valueChanged.connect(self.update_border_width_label)
    
    def choose_fill_color(self):
        color = QColorDialog.getColor(self.fill_color, self)
        if color.isValid():
            self.fill_color = color
            self.fill_color_btn.setStyleSheet(f"background-color: {color.name()}")
    
    def choose_border_color(self):
        color = QColorDialog.getColor(self.border_color, self)
        if color.isValid():
            self.border_color = color
            self.border_color_btn.setStyleSheet(f"background-color: {color.name()}")
    
    def update_border_width_label(self, value):
        self.border_width = value
        self.border_width_label.setText(f"Border Width: {value}")
    
    def get_properties(self):
        return (self.fill_color, self.border_color, self.border_width)

#export image
class ExportDialog(QDialog):
    def __init__(self, x_min, x_max, y_min, y_max, width, height, parent=None):
        super().__init__(parent)
        self.setWindowTitle("PNG export")

        #default
        self.xmin_input = QLineEdit(str(x_min)) #L boundary
        self.xmax_input = QLineEdit(str(x_max)) #R
        self.ymin_input = QLineEdit(str(y_min)) #t
        self.ymax_input = QLineEdit(str(y_max)) #b
        
        self.width_input = QSpinBox()#that small box w/ up/down arrows 
        self.width_input.setRange(1, 10000) # min/max px
        self.width_input.setValue(width)
        
        self.height_input = QSpinBox()
        self.height_input.setRange(1, 10000)
        self.height_input.setValue(height)

        #layout of export window
        form = QFormLayout()
        form.addRow("x_min (links)", self.xmin_input)
        form.addRow("x_max (rechts)", self.xmax_input)
        form.addRow("y_min (oben)", self.ymin_input)
        form.addRow("y_max (unten)", self.ymax_input)
        form.addRow("Breite [px]", self.width_input)
        form.addRow("Höhe [px]", self.height_input)
        self.setLayout(form)

        # OK/cancel
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self.accept) #ok
        buttons.rejected.connect(self.reject) #cancel
        form.addRow(buttons)

    def get_values(self): #gets user-specified export settings
        return (# x/y min/max, width, height
            float(self.xmin_input.text()), float(self.xmax_input.text()),
            float(self.ymin_input.text()), float(self.ymax_input.text()),
            int(self.width_input.value()), int(self.height_input.value())
        )


#main window
class MyWindow(QMainWindow):

    #close
    def quit_app(self):
        self.close()

    #shortcuts for offset & zoom
    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Left:
            self.paintArea.move_view(10 / self.paintArea.zoom, 0) # ansicht nacht links verschieben
        elif event.key() == Qt.Key.Key_Right:
            self.paintArea.move_view(-10 / self.paintArea.zoom, 0) # ansicht nach rechts verschieben
        elif event.key() == Qt.Key.Key_Up:
            self.paintArea.move_view(0, 10 / self.paintArea.zoom) # ansicht nach oben verschieben
        elif event.key() == Qt.Key.Key_Down:
            self.paintArea.move_view(0, -10 / self.paintArea.zoom) # ansicht nach unten verschieben
        elif event.key() == Qt.Key.Key_Plus: # Zoomfaktor erhöhen
            self.paintArea.zoom *= 1.1
            self.paintArea.update()
        elif event.key() == Qt.Key.Key_Minus: # Zoomfaktor verringern
            self.paintArea.zoom /= 1.1
            self.paintArea.update()

    # confirm cloes
    def closeEvent(self, ev: QCloseEvent):
        if QMessageBox.question(
                self, "Please confirm...",
                "Do you really want to close the application?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            ) == QMessageBox.StandardButton.Yes:
            ev.setAccepted(True)
        else:
            ev.setAccepted(False)
            
    #info box
    def show_info(self):
        QMessageBox.question(
            self,
            "About Übungsblatt 02 Musterlösung...",
            "Musterlösung von Übungsblatt 02,\n"
            "EIS SoSem 2024\n"
            "Autor: Michael Wand",
            QMessageBox.StandardButton.Ok,
        )

    #open from file
    def open_img(self):
        file_name, selected_filter = QFileDialog.getOpenFileName(
            self, "Open Image", ".", "PNG Files (*.png)"
        )
        if file_name != "":
            self.paintArea.image = QImage(file_name)
            self.update()
    #save img
    def save_img_as(self):
        file_name, selected_filter = QFileDialog.getSaveFileName(
            self, "Save Image As...", ".", "PNG Files (*.png)"
        )
        if file_name:
            if not file_name.endswith('.png'):
                file_name += '.png'
            self.paint_area.image.save(file_name)
            
    #color pick 
    def show_color_dialog(self):
        color: QColor = QColorDialog.getColor(self.paintArea.pen_color, self)
        if color.isValid():
            self.paintArea.updatePenColor(color)
            
    # Show shape properties dialog
    def show_shape_properties_dialog(self):
        dialog = ShapePropertiesDialog(
            self.paintArea.shape_fill_color,
            self.paintArea.shape_border_color,
            self.paintArea.shape_border_width,
            self
        )
        if dialog.exec() == QDialog.Accepted:
            fill_color, border_color, border_width = dialog.get_properties()
            self.paintArea.updateShapeFillColor(fill_color)
            self.paintArea.updateShapeBorderColor(border_color)
            self.paintArea.updateShapeBorderWidth(border_width)

    def __init__(self, parent):
        super().__init__(parent)

        # set a frame object (empty container) that fills the whole window
        self.paintArea = MyPaintArea(self)

        # set initial window size a bit bigger
        self.resize(1500, 800)
        self.setMinimumWidth(800)
        self.setMinimumHeight(600)

        # a bit of housekeeping...
        self.initMenubar()
        self.initToolbar()

        # make this the content of the main window
        self.setCentralWidget(self.paintArea)

        self.showMaximized()

    def initMenubar(self):
        self.file_menu: QMenuBar = self.menuBar().addMenu("&File")
        #open
        self.open_action = self.file_menu.addAction("&Open...")
        self.open_action.setShortcut(QKeySequence(Qt.Modifier.CTRL | Qt.Key.Key_O))
        self.open_action.setIcon(QPixmap("imgs/open_32x32.png"))
        self.open_action.triggered.connect(self.open_img)
        # save
        self.save_as_action = self.file_menu.addAction("Save &As...")
        self.save_as_action.setShortcut(QKeySequence(Qt.Modifier.CTRL | Qt.Key.Key_S))
        self.save_as_action.setIcon(QPixmap("imgs/saveas_26x26.png"))
        self.save_as_action.triggered.connect(self.save_img_as)
        # vis. seperator
        self.file_menu.addSeparator()
        #export triangles/text
        self.export_tris_txt_action = self.file_menu.addAction(".txt export")
        self.export_tris_txt_action.setToolTip("Exportiere Szene als Textdatei mit Dreieckskoordinaten")
        self.export_tris_txt_action.triggered.connect(self.export_triangles_txt)
        #export svg
        self.export_svg_action = self.file_menu.addAction(".svg export...")
        self.export_svg_action.setToolTip("Exportiere Szene als SVG-Datei")
        self.export_svg_action.triggered.connect(self.export_svg)
        self.file_menu.addSeparator()
        #quit
        self.quit_action = self.file_menu.addAction("&Quit...")
        self.quit_action.setShortcut(QKeySequence(Qt.Modifier.CTRL | Qt.Key.Key_Q))
        self.quit_action.setIcon(QPixmap("imgs/quit_26x26.png"))
        self.quit_action.triggered.connect(self.quit_app)
        #Test-Szenen
        self.test_menu = self.menuBar().addMenu("&Test")
        #1
        self.testscene1_action = self.test_menu.addAction("Testszene 1")
        self.testscene1_action.setToolTip("Erzeuge Testszene 1")
        self.testscene1_action.triggered.connect(self.make_testscene1)
        #2
        self.testscene2_action = self.test_menu.addAction("Testszene 2")
        self.testscene2_action.setToolTip("Erzeuge Testszene 2")
        self.testscene2_action.triggered.connect(self.make_testscene2)
        #help & info
        self.help_menu: QMenuBar = self.menuBar().addMenu("&Help")
        self.info_action = self.help_menu.addAction("&Information...")
        self.info_action.setShortcut(QKeySequence(Qt.Key.Key_F1))
        self.info_action.setIcon(QPixmap("imgs/info_32x32.png"))
        self.info_action.triggered.connect(self.show_info)

    def initToolbar(self):
        self.tools: QToolBar = self.addToolBar("Basic Tools")

        # -- 1. FILE/INFO/QUIT BUTTONS --
        self.tools.addAction(self.open_action)
        self.tools.addAction(self.save_as_action)
        self.tools.addSeparator()
        self.tools.addAction(self.info_action)
        self.tools.addSeparator()
        self.tools.addAction(self.quit_action)
        self.tools.addSeparator()

        # -- 2. PEN COLOR-BUTTON (sichtbarer Button, nicht unsichtbares Feld) --
        self.pen_color_btn = QPushButton("Pen Color")
        self.pen_color_btn.setStyleSheet(f"background-color: {self.paintArea.pen_color.name()}")
        self.pen_color_btn.clicked.connect(self.show_pen_color_chooser)
        self.tools.addWidget(self.pen_color_btn)
        self.tools.addSeparator()

        # -- 3. PEN SIZE SLIDER --
        self.pen_slider: QSlider = QSlider(Qt.Orientation.Horizontal)
        self.pen_slider_label: QLabel = QLabel(f"Pen Size: {self.paintArea.pen_size:>2}")
        self.pen_slider_label.setToolTip("Pen Size")
        self.pen_slider_label.setFixedWidth(65)

        self.pen_slider.setRange(1, 10) #min/max
        self.pen_slider.setValue(self.paintArea.pen_size)
        self.pen_slider.setPageStep(1)
        self.pen_slider.setTickPosition(QSlider.TickPosition.TicksBelow)
        self.pen_slider.setTickInterval(1)
        self.pen_slider.setToolTip("Pen Size")
        self.pen_slider.setFixedWidth(200)
        self.pen_slider.valueChanged.connect(self.paintArea.updatePenSize)
        self.pen_slider.valueChanged.connect(
            lambda value: self.pen_slider_label.setText(f"Pen Size: {value:>2}")
        )
        self.tools.addWidget(self.pen_slider_label)
        self.tools.addSeparator()
        self.tools.addWidget(self.pen_slider)
        self.tools.addSeparator()

        # -- 4. SHAPE PROPERTIES --
        self.shape_props_btn = QPushButton("Shape Properties")
        self.shape_props_btn.setToolTip("Set shape properties (fill, border, width)")
        self.shape_props_btn.clicked.connect(self.show_shape_properties_dialog)
        self.tools.addWidget(self.shape_props_btn)

        # -- 5. SELECTION/SHAPE DRAWING BUTTONS --
        select_btn = QPushButton("Select")
        select_btn.setToolTip("Select and transform shapes")
        select_btn.clicked.connect(lambda: self.paintArea.setTool("select"))
        self.tools.addWidget(select_btn)

        # -- 6. DEFORM BUTTON (direkt nach Select, vor Rechteck) --
        deform_btn = QPushButton("Deform: ON" if self.paintArea.deform_on else "Deform: OFF")
        def update_deform_btn():
            deform_btn.setText("Deform: ON" if self.paintArea.deform_on else "Deform: OFF")
        deform_btn.clicked.connect(lambda: (self.paintArea.toggle_deform(), update_deform_btn()))
        self.tools.addWidget(deform_btn)

        # -- Restliche Shape Buttons --
        rect_btn = QPushButton("Rechteck")
        rect_btn.setToolTip("Rechteck zeichnen")
        rect_btn.clicked.connect(lambda: self.paintArea.setTool("rectangle"))
        self.tools.addWidget(rect_btn)

        circle_btn = QPushButton("Kreis")
        circle_btn.setToolTip("Kreis zeichnen")
        circle_btn.clicked.connect(lambda: self.paintArea.setTool("circle"))
        self.tools.addWidget(circle_btn)

        star_btn = QPushButton("Stern")
        star_btn.setToolTip("Stern zeichnen")
        star_btn.clicked.connect(lambda: self.paintArea.setTool("star"))
        self.tools.addWidget(star_btn)

        freehand_btn = QPushButton("Freihand")
        freehand_btn.setToolTip("Freihand zeichnen")
        freehand_btn.clicked.connect(lambda: self.paintArea.setTool("freehand"))
        self.tools.addWidget(freehand_btn)

        check_point_btn = QPushButton("Check Point")
        check_point_btn.setToolTip("Check if clicked point is inside any shape")
        check_point_btn.clicked.connect(lambda: self.paintArea.setTool("check_point"))
        self.tools.addWidget(check_point_btn)

        self.tools.addSeparator()

        # -- 7. SUBDIV, EXPORT als EINHEITLICHE REIHE --
        right_widget = QWidget()
        right_layout = QHBoxLayout()
        right_layout.setContentsMargins(0, 0, 0, 0)
        right_layout.setSpacing(4)
        right_widget.setLayout(right_layout)

        # Subdivisions-Slider + Label
        subdiv_label = QLabel("Subdivision:")
        subdiv_slider = QSlider(Qt.Orientation.Horizontal)
        subdiv_slider.setMinimum(0)
        subdiv_slider.setMaximum(3)
        subdiv_slider.setValue(self.paintArea.subdiv_level)
        subdiv_slider.setFixedWidth(60)
        subdiv_slider.valueChanged.connect(self.paintArea.set_subdiv_level)
        subdiv_value_label = QLabel(str(self.paintArea.subdiv_level))
        subdiv_slider.valueChanged.connect(lambda val: subdiv_value_label.setText(str(val)))
        right_layout.addWidget(subdiv_label)
        right_layout.addWidget(subdiv_slider)
        right_layout.addWidget(subdiv_value_label)

        # Export PNG Button
        export_btn = QPushButton(".png export")
        export_btn.setToolTip("Szene als PNG exportieren")
        export_btn.clicked.connect(self.export_scene)
        right_layout.addWidget(export_btn)

        # Export TXT Button
        export_tris_txt_btn = QPushButton(".txt export")
        export_tris_txt_btn.setToolTip("Exportiere Szene als Textdatei mit Dreieckskoordinaten")
        export_tris_txt_btn.clicked.connect(self.export_triangles_txt)
        right_layout.addWidget(export_tris_txt_btn)

        # Export SVG Button
        export_svg_btn = QPushButton(".svg export")
        export_svg_btn.setToolTip("Exportiere Szene als SVG-Datei")
        export_svg_btn.clicked.connect(self.export_svg)
        right_layout.addWidget(export_svg_btn)

        right_action = QWidgetAction(self)
        right_action.setDefaultWidget(right_widget)
        self.tools.addSeparator()
        self.tools.addAction(right_action)

    # -- PEN COLOR BUTTON HANDLER --
    def show_pen_color_chooser(self):
        color: QColor = QColorDialog.getColor(self.paintArea.pen_color, self)
        if color.isValid():
            self.paintArea.updatePenColor(color)
            # Button-Background anpassen:
            self.pen_color_btn.setStyleSheet(f"background-color: {color.name()}")

    def export_scene(self):
        x_min, x_max, y_min, y_max = self.paintArea.scene.bounding_box() ##get current scene dimns
        width, height = 1920, 1080 #default

        #export dialg
        dialog = ExportDialog(x_min, x_max, y_min, y_max, width, height, self)
        if dialog.exec() == QDialog.Accepted:
            x_min, x_max, y_min, y_max, width, height = dialog.get_values()     #get ^
            
            file_name, _ = QFileDialog.getSaveFileName(         #output file path
                self, "Szene exportieren als...", ".", "PNG Files (*.png)"
            )
            
            if file_name:
                img = QImage(width, height, QImage.Format.Format_RGB32)
                img.fill(QColor("white"))   #blank img w/ white bg
                #render drawn scene to img
                painter = QPainter(img)
                render_scene_to_painter(
                    painter, self.paintArea.scene, x_min, x_max, y_min, y_max, width, height,
                    subdiv_level=self.paintArea.subdiv_level,
                    deform_on=self.paintArea.deform_on,
                    deform_params=DEFORM_PARAMS
                )
                painter.end()
                #save it
                img.save(file_name)

    def export_triangles_txt(self):
        file_name, _ = QFileDialog.getSaveFileName(
            self, "Export Dreiecke als Text...", ".", "Textdateien (*.txt)"
        )
        if not file_name:
            return
        if not file_name.endswith('.txt'):
            file_name += '.txt'
        # Dreiecksliste erzeugen (wie im Rendering)
        triangles = []
        for shape in self.paintArea.scene.shapes:
            tris = shape.describe_shape()
            tris = subdivide_triangles(tris, self.paintArea.subdiv_level)
            if self.paintArea.deform_on:
                tris = deform_triangles(tris, DEFORM_PARAMS)
            triangles.extend(tris)
        # Schreibe als Text: jede Zeile: x0 y0 x1 y1 x2 y2 (Farben ignoriert)
        with open(file_name, "w", encoding="utf-8") as f:
            f.write("# Dreiecksliste (jedes Dreieck: x0 y0 x1 y1 x2 y2)\n")
            for tri in triangles:
                line = f"{tri.p0[0]} {tri.p0[1]} {tri.p1[0]} {tri.p1[1]} {tri.p2[0]} {tri.p2[1]}\n"
                f.write(line)

    def export_svg(self):
        file_name, _ = QFileDialog.getSaveFileName(
            self, "Export SVG...", ".", "SVG Dateien (*.svg)"
        )
        if not file_name:
            return
        if not file_name.endswith('.svg'):
            file_name += '.svg'
        # SVG-Größe und BoundingBox bestimmen
        x_min, x_max, y_min, y_max = self.paintArea.scene.bounding_box()
        width, height = 1000, 1000
        svg_w = width
        svg_h = height
        # Welt zu SVG-Koordinaten
        scale_x = svg_w / (x_max - x_min) if (x_max - x_min) != 0 else 1
        scale_y = svg_h / (y_max - y_min) if (y_max - y_min) != 0 else 1

        triangles = []
        for shape in self.paintArea.scene.shapes:
            tris = shape.describe_shape()
            tris = subdivide_triangles(tris, self.paintArea.subdiv_level)
            if self.paintArea.deform_on:
                tris = deform_triangles(tris, DEFORM_PARAMS)
            triangles.extend(tris)
        # Schreibe SVG
        with open(file_name, "w", encoding="utf-8") as f:
            f.write('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n')
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_w}" height="{svg_h}" version="1.1">\n')
            f.write(f'<g>\n')
            for tri in triangles:
                # Koordinaten transformieren
                def tx(p):
                    # SVG y-Achse ist nach unten, wie hier!
                    x = (p[0] - x_min) * scale_x
                    y = (p[1] - y_min) * scale_y
                    return x, y
                p0x, p0y = tx(tri.p0)
                p1x, p1y = tx(tri.p1)
                p2x, p2y = tx(tri.p2)
                # Farben umrechnen
                fill = tri.fill_color.name() if hasattr(tri.fill_color, "name") else "#ffffff"
                stroke = tri.border_color.name() if hasattr(tri.border_color, "name") else "#000000"
                stroke_width = tri.border_width if hasattr(tri, "border_width") else 1
                # SVG Dreieck
                f.write(
                    f'<polygon points="{p0x},{p0y} {p1x},{p1y} {p2x},{p2y}" '
                    f'style="fill:{fill};stroke:{stroke};stroke-width:{stroke_width};"/>\n'
                )
            f.write('</g>\n</svg>\n')

    def make_testscene1(self): #Rechteck + Kreis (überlappend)
        scene = Scene()
        
        # Blauer Rand, kein Fill
        rect = Rectangle(50, 50, 200, 200, QColor(255, 255, 255), QColor(0, 0, 200), 2)
        
        # Roter Kreis
        circle = Circle(150, 150, 100, QColor(255, 255, 255), QColor(200, 0, 0), 2)

        # Stern (gelb, mittig, 5 Zacken)
        star = Star(300, 185, 70, 5, QColor(255, 255, 0), QColor(255, 180, 0), 2)
        
        #add all to scene & update
        scene.add_shape(rect)
        scene.add_shape(circle)
        scene.add_shape(star)
        self.paintArea.scene = scene
        self.paintArea.update()

    def make_testscene2(self):#4 Kreise (rot), 4 Quadrate (blau) als "Rahmen"
        scene = Scene()
        
        # Vier Quadrate
        sz = 80
        scene.add_shape(Rectangle(100, 60, sz, sz, QColor(50, 50, 200), QColor(0, 0, 0), 2))
        scene.add_shape(Rectangle(220, 60, sz, sz, QColor(50, 50, 200), QColor(0, 0, 0), 2))
        scene.add_shape(Rectangle(100, 180, sz, sz, QColor(50, 50, 200), QColor(0, 0, 0), 2))
        scene.add_shape(Rectangle(220, 180, sz, sz, QColor(50, 50, 200), QColor(0, 0, 0), 2))
        
        # Vier Kreise in Ecken
        r = 40
        scene.add_shape(Circle(100, 60, r, QColor(200, 0, 0), QColor(200, 0, 0), 2))
        scene.add_shape(Circle(300, 60, r, QColor(200, 0, 0), QColor(200, 0, 0), 2))
        scene.add_shape(Circle(100, 260, r, QColor(200, 0, 0), QColor(200, 0, 0), 2))
        scene.add_shape(Circle(300, 260, r, QColor(200, 0, 0), QColor(200, 0, 0), 2))

        # Stern in der Mitte
        scene.add_shape(Star(200, 160, 60, 5, QColor(255, 255, 0), QColor(180, 180, 0), 2))
        
        self.paintArea.scene = scene
        self.paintArea.update()

###### Aufgabe 2a: Triangle-Datentyp ######
class Triangle:
    def __init__(self, p0, p1, p2, fill_color, border_color, border_width):
        self.p0 = p0  # (x, y)
        self.p1 = p1
        self.p2 = p2
        self.fill_color = fill_color
        self.border_color = border_color
        self.border_width = border_width
######

###### Aufgabe 2b: Subdivision-Operation ######
def subdivide_triangles(triangles: List[Triangle], n: int) -> List[Triangle]:
    """
    Teilt jede Dreieck n-mal per 1:4-Split (mittels Kantenhalbierung).
    """
    if n <= 0:
        return triangles
    result = triangles
    for _ in range(n):
        result = _subdivide_once(result)
    return result

def _midpoint(p1, p2):
    return ((p1[0]+p2[0])/2, (p1[1]+p2[1])/2)

def _subdivide_once(triangles: List[Triangle]) -> List[Triangle]:
    new_tris = []
    for tri in triangles:
        a, b, c = tri.p0, tri.p1, tri.p2
        ab = _midpoint(a, b)
        bc = _midpoint(b, c)
        ca = _midpoint(c, a)
        col = tri.fill_color
        bordcol = tri.border_color
        bordw = tri.border_width
        # Vier neue Dreiecke
        new_tris.append(Triangle(a, ab, ca, col, bordcol, bordw))
        new_tris.append(Triangle(ab, b, bc, col, bordcol, bordw))
        new_tris.append(Triangle(ca, bc, c, col, bordcol, bordw))
        new_tris.append(Triangle(ab, bc, ca, col, bordcol, bordw))
    return new_tris
######

###### Aufgabe 2b: Deformation-Operation ######
def deform_triangles(triangles: List[Triangle], params: dict) -> List[Triangle]:
    """
    Verschiebt alle Dreieckseckpunkte in y-Richtung entlang einer Sinuskurve.
    f(x) = a * sin(2pi * b * x + c)
    """
    a = params.get("a", 20)
    b = params.get("b", 1/200)
    c = params.get("c", 0)
    def deform_point(p):
        x, y = p
        y_new = y + a * math.sin(2 * math.pi * b * x + c)
        return (x, y_new)
    new_tris = []
    for tri in triangles:
        p0 = deform_point(tri.p0)
        p1 = deform_point(tri.p1)
        p2 = deform_point(tri.p2)
        new_tris.append(Triangle(p0, p1, p2, tri.fill_color, tri.border_color, tri.border_width))
    return new_tris
######

#abstrct base class for all shapes
class Shape:
    def __init__(self, x: float, y: float, fill_color: QColor, border_color: QColor, border_width: int = 1):
        self.x = x
        self.y = y
        self.fill_color = fill_color
        self.border_color = border_color
        self.border_width = border_width  #border width property
        self.selected = False  #selection state
  
    def draw(self, painter: QPainter):
        raise NotImplementedError("Subclasses must implement draw() method")

    def bounding_box(self):
        raise NotImplementedError("Subclasses must implement bounding_box() method")
        
    def contains_point(self, point_x: float, point_y: float) -> bool:#Check if point is within shape's bounding box
        x_min, x_max, y_min, y_max = self.bounding_box()
        return (x_min <= point_x <= x_max) and (y_min <= point_y <= y_max)
        
    def move(self, dx: float, dy: float):#Move shape by dx, dy
        self.x += dx
        self.y += dy
        
    def scale(self, factor_x: float, factor_y: float):#Scale shape by factors in x and y directions
        raise NotImplementedError("Subclasses must implement scale() method")
        
    def draw_selection(self, painter: QPainter):#Draw selection handles around the shape
        if not self.selected:
            return
            
        #bounding box
        pen = QPen(QColor(0, 0, 255), 1, Qt.PenStyle.DashLine)
        painter.setPen(pen)
        painter.setBrush(Qt.BrushStyle.NoBrush)
        x_min, x_max, y_min, y_max = self.bounding_box()
        painter.drawRect(x_min, y_min, x_max - x_min, y_max - y_min)
        
        #resize handles (small squrs at corners and midpoints)
        handle_size = 5
        handles = [
            (x_min, y_min),  # top-left
            (x_min, (y_min + y_max)/2),  # left-middle
            (x_min, y_max),  # bottom-left
            ((x_min + x_max)/2, y_min),  # top-middle
            ((x_min + x_max)/2, y_max),  # bottom-middle
            (x_max, y_min),  # top-right
            (x_max, (y_min + y_max)/2),  # right-middle
            (x_max, y_max)  # bottom-right
        ]
        
        painter.setPen(QPen(QColor(0, 0, 255), 1))
        painter.setBrush(QColor(200, 200, 255))
        for hx, hy in handles:
            painter.drawRect(hx - handle_size/2, hy - handle_size/2, handle_size, handle_size)

    ###### Aufgabe 2a: describe_shape() Methode ######
    def describe_shape(self, max_edge_length: float = 10.0) -> List['Triangle']:
        """
        Abstrakte Methode: Zerlegt die Geometrie in Dreiecke.
        max_edge_length gibt an, wie fein zerlegt wird.
        """
        raise NotImplementedError("describe_shape() must be implemented in subclasses!")
    ######

            
class Rectangle(Shape):
    def __init__(self, x: float, y: float, width: float, height: float,
                 fill_color: QColor, border_color: QColor, border_width: int = 1):
        super().__init__(x, y, fill_color, border_color, border_width)
        self.width = width
        self.height = height
    
    def bounding_box(self):
        return (self.x, self.x + self.width, self.y, self.y + self.height)

    def draw(self, painter: QPainter):
        pen = QPen(self.border_color, self.border_width)  # Use border width
        painter.setPen(pen)
        painter.setBrush(self.fill_color)
        painter.drawRect(self.x, self.y, self.width, self.height)
        self.draw_selection(painter)
        
    def scale(self, factor_x: float, factor_y: float):
        self.width *= factor_x
        self.height *= factor_y
        
    def contains_point(self, point_x: float, point_y: float) -> bool:
        return (self.x <= point_x <= self.x + self.width and 
                self.y <= point_y <= self.y + self.height)

    ###### Aufgabe 2a: describe_shape für Rectangle ######
    def describe_shape(self, max_edge_length: float = 10.0) -> List['Triangle']:
        """
        Zerlegt das Rechteck in kleine Dreiecke (Triangularisierung eines Gitters).
        """
        tris = []
        # Zahl der Schritte in x/y (mindestens 1)
        nx = max(1, int(math.ceil(self.width / max_edge_length)))
        ny = max(1, int(math.ceil(self.height / max_edge_length)))
        dx = self.width / nx
        dy = self.height / ny
        # Gitterpunkte erzeugen
        for ix in range(nx):
            for iy in range(ny):
                # Koordinaten der vier Ecken der aktuellen Zelle
                x0 = self.x + ix*dx
                y0 = self.y + iy*dy
                x1 = x0 + dx
                y1 = y0 + dy
                # Zwei Dreiecke pro Zelle ("unten links" + "oben rechts")
                tris.append(Triangle(
                    (x0, y0), (x1, y0), (x1, y1), self.fill_color, self.border_color, self.border_width
                ))
                tris.append(Triangle(
                    (x0, y0), (x1, y1), (x0, y1), self.fill_color, self.border_color, self.border_width
                ))
        return tris
    ######
        

class Circle(Shape):
    def __init__(self, x: float, y: float, radius: float,
                 fill_color: QColor, border_color: QColor, border_width: int = 1):
        super().__init__(x, y, fill_color, border_color, border_width)
        self.radius = radius

    def bounding_box(self):
        return (self.x - self.radius, self.x + self.radius, 
                self.y - self.radius, self.y + self.radius)

    def draw(self, painter: QPainter):
        pen = QPen(self.border_color, self.border_width)  # Use border width
        painter.setPen(pen)
        painter.setBrush(self.fill_color)
        painter.drawEllipse(self.x - self.radius, self.y - self.radius,
                          self.radius * 2, self.radius * 2)
        self.draw_selection(painter)
        
    def scale(self, factor_x: float, factor_y: float):#only scales the whole circle aka keine ellips
        avg_factor = (factor_x + factor_y) / 2
        self.radius *= avg_factor
        
    def contains_point(self, point_x: float, point_y: float) -> bool:
        """More precise point-in-circle test"""
        dx = point_x - self.x
        dy = point_y - self.y
        return dx*dx + dy*dy <= self.radius*self.radius

    ###### Aufgabe 2a: describe_shape für Circle ######
    def describe_shape(self, max_edge_length: float = 10.0) -> List['Triangle']:
        """
        Approximiert den Kreis als Vieleck und zerlegt ihn in Dreiecke (Fächer-Triangulierung).
        """
        # Umfang = 2 * math.pi * r, daraus wie viele Ecken für etwa max_edge_length?
        circumference = 2 * math.pi * self.radius
        n_segments = max(6, int(math.ceil(circumference / max_edge_length)))
        tris = []
        cx, cy = self.x, self.y
        for i in range(n_segments):
            angle0 = 2 * math.pi * i / n_segments
            angle1 = 2 * math.pi * (i+1) / n_segments
            p0 = (cx, cy)
            p1 = (cx + self.radius * math.cos(angle0), cy + self.radius * math.sin(angle0))
            p2 = (cx + self.radius * math.cos(angle1), cy + self.radius * math.sin(angle1))
            tris.append(Triangle(p0, p1, p2, self.fill_color, self.border_color, self.border_width))
        return tris
    ######

###### Aufgabe 2a: (optional) Stern-Shape für Test etc. ######
class Star(Shape):
    def __init__(self, x: float, y: float, radius: float, points: int,
                 fill_color: QColor, border_color: QColor, border_width: int = 1):
        super().__init__(x, y, fill_color, border_color, border_width)
        self.radius = radius
        self.points = max(5, points)

    def bounding_box(self):
        r = self.radius
        return (self.x - r, self.x + r, self.y - r, self.y + r)

    def draw(self, painter: QPainter):
        # (nur grob, für Tests)
        painter.setPen(QPen(self.border_color, self.border_width))
        painter.setBrush(self.fill_color)
        pts = []
        for i in range(self.points * 2):
            angle = math.pi * i / self.points
            r = self.radius if i % 2 == 0 else self.radius * 0.5
            pts.append(QPointF(self.x + r * math.cos(angle), self.y + r * math.sin(angle)))
        painter.drawPolygon(QPolygonF(pts))
        self.draw_selection(painter)

    def scale(self, factor_x: float, factor_y: float):
        avg_factor = (factor_x + factor_y) / 2
        self.radius *= avg_factor

    def contains_point(self, point_x: float, point_y: float) -> bool:
        # grob
        dx = point_x - self.x
        dy = point_y - self.y
        return dx*dx + dy*dy <= self.radius*self.radius

    def describe_shape(self, max_edge_length: float = 10.0) -> List['Triangle']:
        # Annäherung: Stern als Polygon, dann von Mittelpunkt aus Dreiecke
        pts = []
        for i in range(self.points * 2):
            angle = math.pi * i / self.points
            r = self.radius if i % 2 == 0 else self.radius * 0.5
            pts.append((self.x + r * math.cos(angle), self.y + r * math.sin(angle)))
        tris = []
        cx, cy = self.x, self.y
        for i in range(len(pts)):
            p0 = (cx, cy)
            p1 = pts[i]
            p2 = pts[(i+1) % len(pts)]
            tris.append(Triangle(p0, p1, p2, self.fill_color, self.border_color, self.border_width))
        return tris
######

class Scene:
    def __init__(self):
        self.shapes: list[Shape] = [] #list of all shapes

    def add_shape(self, shape: Shape): #add shape to scene
        self.shapes.append(shape)

    def draw_all(self, painter: QPainter):  #drwa all shapes in scene
        for shape in self.shapes:
            shape.draw(painter)

    def bounding_box(self): #calc bounding box of all shapes in scene
        if not self.shapes:
            return 0, 1, 0, 1  # Standardwerte, falls Szene leer ist  
        
        xmins, xmaxs, ymins, ymaxs = [], [], [], [] #collext all bounds from each shape in scene
        for s in self.shapes:
            bb = s.bounding_box()
            xmins.append(bb[0]) 
            xmaxs.append(bb[1])
            ymins.append(bb[2])
            ymaxs.append(bb[3])
            
        return min(xmins), max(xmaxs), min(ymins), max(ymaxs) #return "new calc" box bounds that contains all
     
    def select_shape_at(self, x: float, y: float) -> Shape | None:
        # Deselect all shapes first
        for shape in self.shapes:
            shape.selected = False
        # Check shapes from top to bottom (reverse order)
        for shape in reversed(self.shapes):
            if shape.contains_point(x, y):
                shape.selected = True
                return shape
        return None
    def get_selected_shape(self) -> Shape | None:#currently selected
        for shape in self.shapes:
            if shape.selected:
                return shape
        return None

###### Aufgabe 2a: Hilfsfunktion zum Zeichnen von Dreiecken ######
def draw_triangles(painter: QPainter, triangles: List[Triangle]):
    for tri in triangles:
        # Füllen
        painter.setBrush(tri.fill_color)
        painter.setPen(Qt.NoPen)
        poly = QPolygonF([QPointF(tri.p0[0], tri.p0[1]), QPointF(tri.p1[0], tri.p1[1]), QPointF(tri.p2[0], tri.p2[1])])
        painter.drawPolygon(poly)
        # Rand
        painter.setBrush(Qt.NoBrush)
        painter.setPen(QPen(tri.border_color, tri.border_width))
        painter.drawPolygon(poly)
######

###### Aufgabe 2b: Render mit Subdivision/Deformation für Export ######
def render_scene_to_painter(painter: QPainter, scene: Scene,    #Render scene to a painter with ^   
                            x_min: float, x_max: float,
                            y_min: float, y_max: float,
                            pixel_width: int, pixel_height: int,
                            subdiv_level: int = SUBDIV_LEVEL,
                            deform_on: bool = DEFORM_ON,
                            deform_params: dict = DEFORM_PARAMS):
   
    #white bg
    painter.save()
    painter.setBrush(QColor("white"))
    painter.setPen(QColor("white"))
    painter.drawRect(0, 0, pixel_width, pixel_height)
    painter.restore()

    #calc scaling 
    scale_x = pixel_width / (x_max - x_min)
    scale_y = pixel_height / (y_max - y_min)

    painter.save() #get current painter state 
    painter.translate(0, pixel_height) #origin bottom left 
    painter.scale(scale_x, -scale_y) #scale output size + flip y-achse 
    painter.translate(-x_min, -y_min) #Move origin to match the requested world coordinate bounds

    #draw with triangles + subdiv + deform!
    triangles = []
    for shape in scene.shapes:
        tris = shape.describe_shape()
        tris = subdivide_triangles(tris, subdiv_level)
        if deform_on:
            tris = deform_triangles(tris, deform_params)
        triangles.extend(tris)
    draw_triangles(painter, triangles)

    # Auswahlrahmen für selektierte Shapes weiterzeichnen (optional)
    for shape in scene.shapes:
        shape.draw_selection(painter)

    # reset painter
    painter.restore()
######

# our main program starts here, Python-style
if __name__ == "__main__":
    # create an application object (needs cmd-line arguments)
    app: QApplication = QApplication(sys.argv)

    # Create the main window.
    main_window: MyWindow = MyWindow(None)
    main_window.show()

    # Start the event loop.
    # Ends only after closing the main window
    app.exec()
