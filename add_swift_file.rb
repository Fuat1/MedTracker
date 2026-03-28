require 'xcodeproj'
project_path = './ios/MedTracker.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
group = project.main_group.find_subpath('MedTracker', true)
file_ref = group.new_file('LogBloodPressureIntent.swift')
target.add_file_references([file_ref])
project.save
puts "Successfully added LogBloodPressureIntent.swift to Xcode project."
